package com.plantcare_backend.dto.validator;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.exception.RateLimitExceededException;
import com.plantcare_backend.exception.ValidationException;
import com.plantcare_backend.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserPlantValidator {
    @Autowired
    private final PlantRepository plantRepository;

    public void validateUserPlant(CreateUserPlantRequestDTO request, Long userId) {
        log.info("Validating user plant request for user: {}", userId);

        // 1. Validate scientific name
        validateScientificName(request.getScientificName());

        // 2. Validate common name
        validateCommonName(request.getCommonName());

        // 3. Validate content
        validateContent(request.getDescription(), request.getCareInstructions());

        // 4. Check duplicate
        checkDuplicateScientificName(request.getScientificName());

        // 5. Check rate limit
        checkRateLimit(userId);

        log.info("User plant validation passed for user: {}", userId);
    }

    private void validateScientificName(String scientificName) {
        if (scientificName == null || scientificName.trim().isEmpty()) {
            throw new ValidationException("Tên khoa học không được để trống");
        }

        if (!ValidationUtils.isValidScientificName(scientificName)) {
            throw new ValidationException(
                    "Tên khoa học phải có định dạng: Chi loài [cultivar] (ví dụ: Ficus elastica, Aglaonema rotundum pink)");
        }

        if (!ValidationUtils.isLengthInRange(scientificName,
                ValidationConstants.MIN_SCIENTIFIC_NAME_LENGTH,
                ValidationConstants.MAX_SCIENTIFIC_NAME_LENGTH)) {
            throw new ValidationException("Tên khoa học phải từ " +
                    ValidationConstants.MIN_SCIENTIFIC_NAME_LENGTH + "-" +
                    ValidationConstants.MAX_SCIENTIFIC_NAME_LENGTH + " ký tự");
        }
    }

    private void validateCommonName(String commonName) {
        if (commonName == null || commonName.trim().isEmpty()) {
            throw new ValidationException("Tên thường không được để trống");
        }

        if (!ValidationUtils.isValidCommonName(commonName)) {
            throw new ValidationException("Tên thường chứa ký tự không hợp lệ");
        }

        if (!ValidationUtils.isLengthInRange(commonName,
                ValidationConstants.MIN_COMMON_NAME_LENGTH,
                ValidationConstants.MAX_COMMON_NAME_LENGTH)) {
            throw new ValidationException("Tên thường phải từ " +
                    ValidationConstants.MIN_COMMON_NAME_LENGTH + "-" +
                    ValidationConstants.MAX_COMMON_NAME_LENGTH + " ký tự");
        }

        if (ValidationUtils.containsSpamKeywords(commonName)) {
            throw new ValidationException("Tên thường chứa từ khóa không phù hợp");
        }
    }

    private void validateContent(String description, String careInstructions) {
        // Kiểm tra spam keywords
        String content = ((description != null ? description : "") + " " +
                (careInstructions != null ? careInstructions : "")).toLowerCase();

        if (ValidationUtils.containsSpamKeywords(content)) {
            throw new ValidationException("Nội dung chứa từ khóa không phù hợp");
        }

        // Kiểm tra độ dài tối thiểu
        if (description != null && !ValidationUtils.isLengthInRange(description,
                ValidationConstants.MIN_DESCRIPTION_LENGTH,
                ValidationConstants.MAX_DESCRIPTION_LENGTH)) {
            throw new ValidationException("Mô tả phải từ " +
                    ValidationConstants.MIN_DESCRIPTION_LENGTH + "-" +
                    ValidationConstants.MAX_DESCRIPTION_LENGTH + " ký tự");
        }

        if (careInstructions != null && !ValidationUtils.isLengthInRange(careInstructions,
                ValidationConstants.MIN_CARE_INSTRUCTIONS_LENGTH,
                ValidationConstants.MAX_CARE_INSTRUCTIONS_LENGTH)) {
            throw new ValidationException("Hướng dẫn chăm sóc phải từ " +
                    ValidationConstants.MIN_CARE_INSTRUCTIONS_LENGTH + "-" +
                    ValidationConstants.MAX_CARE_INSTRUCTIONS_LENGTH + " ký tự");
        }

        // Kiểm tra HTML tags
        if (ValidationUtils.containsHtmlTags(description)) {
            throw new ValidationException("Mô tả không được chứa HTML tags");
        }

        if (ValidationUtils.containsHtmlTags(careInstructions)) {
            throw new ValidationException("Hướng dẫn chăm sóc không được chứa HTML tags");
        }
    }

    private void checkDuplicateScientificName(String scientificName) {
        // Kiểm tra trong cây official (created_by IS NULL)
        if (plantRepository.existsByScientificNameIgnoreCaseAndCreatedByIsNull(scientificName)) {
            throw new ValidationException("Cây với tên khoa học '" + scientificName + "' đã tồn tại trong hệ thống");
        }

        // Kiểm tra trong tất cả cây
        if (plantRepository.existsByScientificNameIgnoreCase(scientificName)) {
            throw new ValidationException("Cây với tên khoa học '" + scientificName + "' đã tồn tại");
        }
    }

    private void checkRateLimit(Long userId) {
        java.sql.Timestamp todayStart = java.sql.Timestamp.valueOf(
                java.time.LocalDate.now().atStartOfDay());
        java.sql.Timestamp todayEnd = java.sql.Timestamp.valueOf(
                java.time.LocalDate.now().atTime(23, 59, 59, 999999999));

        long todayCreatedCount = plantRepository.countByCreatedByAndCreatedAtBetween(
                userId, todayStart, todayEnd);

        if (todayCreatedCount >= ValidationConstants.DAILY_PLANT_LIMIT) {
            throw new RateLimitExceededException(
                    "Bạn đã tạo " + ValidationConstants.DAILY_PLANT_LIMIT
                            + " cây hôm nay. Vui lòng thử lại vào ngày mai.");
        }
    }

}
