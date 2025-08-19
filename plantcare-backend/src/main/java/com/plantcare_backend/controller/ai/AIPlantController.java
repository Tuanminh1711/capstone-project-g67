package com.plantcare_backend.controller.ai;

import com.plantcare_backend.annotation.VIPOnly;
import com.plantcare_backend.dto.response.ai.PlantIdentificationResponseDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.service.AIPlantService;
import com.plantcare_backend.service.impl.ai.AIPlantServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Plant Controller", description = "APIs for AI-powered plant identification")
@CrossOrigin(origins = "http://localhost:4200/")
public class AIPlantController {

    private final AIPlantService aiPlantService;

    /**
     * Nhận diện cây từ ảnh
     */
    @VIPOnly(message = "Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP. Vui lòng nâng cấp tài khoản để sử dụng.")
    @Operation(summary = "Identify plant from image", description = "Use AI to identify plant species from uploaded image")
    @PostMapping("/identify-plant")
    public ResponseData<PlantIdentificationResponseDTO> identifyPlant(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "language", defaultValue = "vi") String language,
            @RequestParam(value = "maxResults", defaultValue = "5") Integer maxResults) {

        log.info("AI Plant identification request received for image: {}", image.getOriginalFilename());

        try {
            // Enhanced image validation for mobile devices
            ValidationResult validationResult = validateImageForMobile(image);
            if (!validationResult.isValid()) {
                log.warn("Image validation failed: {}", validationResult.getErrorMessage());
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), validationResult.getErrorMessage());
            }

            PlantIdentificationResponseDTO result = aiPlantService.identifyPlant(image, language, maxResults);

            if ("SUCCESS".equals(result.getStatus())) {
                return new ResponseData<>(HttpStatus.OK.value(), "Plant identification completed successfully", result);
            } else {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), result.getMessage());
            }

        } catch (Exception e) {
            log.error("Error during plant identification", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Plant identification failed: " + e.getMessage());
        }
    }

    /**
     * Validate xem ảnh có phải là thực vật không
     */
    @Operation(summary = "Validate plant image", description = "Check if uploaded image contains a plant")
    @PostMapping("/validate-plant-image")
    public ResponseData<Boolean> validatePlantImage(@RequestParam("image") MultipartFile image) {

        log.info("Plant image validation request received for image: {}", image.getOriginalFilename());

        try {
            // Enhanced validation for mobile images
            ValidationResult validationResult = validateImageForMobile(image);
            if (!validationResult.isValid()) {
                log.warn("Image validation failed during plant validation: {}", validationResult.getErrorMessage());
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), validationResult.getErrorMessage());
            }

            Boolean isValid = aiPlantService.validatePlantImage(image);

            return new ResponseData<>(HttpStatus.OK.value(),
                    isValid ? "Image contains a plant" : "Image does not contain a plant",
                    isValid);

        } catch (Exception e) {
            log.error("Error during plant image validation", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Plant image validation failed: " + e.getMessage());
        }
    }

    /**
     * Tìm kiếm cây trong database
     */
    @Operation(summary = "Search plants in database", description = "Search for plants in database by name")
    @GetMapping("/search-plants")
    public ResponseData<PlantIdentificationResponseDTO> searchPlantsInDatabase(
            @RequestParam("plantName") String plantName) {

        log.info("Database plant search request received for: {}", plantName);

        try {
            if (plantName == null || plantName.trim().isEmpty()) {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Plant name is required");
            }

            PlantIdentificationResponseDTO result = aiPlantService.searchPlantsInDatabase(plantName.trim());

            if ("SUCCESS".equals(result.getStatus())) {
                return new ResponseData<>(HttpStatus.OK.value(), "Plant search completed successfully", result);
            } else {
                return new ResponseError(HttpStatus.BAD_REQUEST.value(), result.getMessage());
            }

        } catch (Exception e) {
            log.error("Error during plant search", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Plant search failed: " + e.getMessage());
        }
    }

    /**
     * Test API key
     */
    @Operation(summary = "Test API key", description = "Test Plant.id API key configuration")
    @GetMapping("/test-api-key")
    public ResponseData<String> testApiKey() {
        log.info("Testing API key configuration");

        try {
            // Cast to implementation để gọi test method
            if (aiPlantService instanceof AIPlantServiceImpl) {
                ((AIPlantServiceImpl) aiPlantService).testApiKey();
                return new ResponseData<>(HttpStatus.OK.value(), "API key test completed", "Check logs for details");
            } else {
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Service implementation not found");
            }
        } catch (Exception e) {
            log.error("Error testing API key", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "API key test failed: " + e.getMessage());
        }
    }

    /**
     * Enhanced image validation for mobile devices
     */
    private ValidationResult validateImageForMobile(MultipartFile image) {
        // Check if file is empty
        if (image.isEmpty()) {
            return ValidationResult.invalid("Image file is required");
        }

        // Check file size with more flexible limit for mobile
        long maxSize = 25 * 1024 * 1024; // 25MB for mobile images
        if (image.getSize() > maxSize) {
            return ValidationResult.invalid("Image size must be less than 25MB");
        }

        // Enhanced content type validation
        String contentType = image.getContentType();
        if (contentType == null) {
            // Try to determine content type from file extension
            String filename = image.getOriginalFilename();
            if (filename != null) {
                String extension = getFileExtension(filename);
                if (isValidImageExtension(extension)) {
                    contentType = "image/" + extension;
                    log.info("Inferred content type from extension: {} -> {}", extension, contentType);
                }
            }
        }

        if (contentType == null || !isValidImageContentType(contentType)) {
            log.warn("Invalid content type: {}", contentType);
            return ValidationResult.invalid("File must be a valid image (JPEG, PNG, GIF, WebP, HEIC)");
        }

        // Check file extension
        String filename = image.getOriginalFilename();
        if (filename != null) {
            String extension = getFileExtension(filename);
            if (!isValidImageExtension(extension)) {
                log.warn("Invalid file extension: {}", extension);
                return ValidationResult.invalid("File extension not supported. Please use JPEG, PNG, GIF, WebP, or HEIC");
            }
        }

        log.info("Image validation passed for: {} (type: {}, size: {} bytes)",
                filename, contentType, image.getSize());
        return ValidationResult.valid();
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Check if file extension is valid
     */
    private boolean isValidImageExtension(String extension) {
        return Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "heic", "heif").contains(extension);
    }

    /**
     * Check if content type is valid
     */
    private boolean isValidImageContentType(String contentType) {
        return contentType.startsWith("image/") &&
                (contentType.contains("jpeg") || contentType.contains("png") ||
                        contentType.contains("gif") || contentType.contains("webp") ||
                        contentType.contains("heic") || contentType.contains("heif"));
    }

    /**
     * Validation result class
     */
    private static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}