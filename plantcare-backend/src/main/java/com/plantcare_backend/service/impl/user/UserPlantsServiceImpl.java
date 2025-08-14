package com.plantcare_backend.service.impl.user;

import com.plantcare_backend.dto.request.userPlants.*;
import com.plantcare_backend.dto.response.userPlants.*;
import com.plantcare_backend.dto.validator.UserPlantValidator;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.exception.ValidationException;
import com.plantcare_backend.model.*;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.CareLog;
import com.plantcare_backend.model.UserPlantImage;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantImageRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.UserPlantsService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.CareTypeRepository;
import com.plantcare_backend.repository.CareLogRepository;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserPlantsServiceImpl implements UserPlantsService {
    @Autowired
    private final UserPlantRepository userPlantRepository;
    @Autowired
    private final PlantRepository plantRepository;
    @Autowired
    private final PlantCategoryRepository plantCategoryRepository;
    @Autowired
    private final UserPlantValidator userPlantValidator;
    @Autowired
    private final PlantImageRepository plantImageRepository;
    @Autowired
    private final CareScheduleRepository careScheduleRepository;
    @Autowired
    private final CareTypeRepository careTypeRepository;
    @Autowired
    private final CareLogRepository careLogRepository;

    @Override
    public UserPlantsSearchResponseDTO searchUserPlants(UserPlantsSearchRequestDTO request) {
        String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "ASC";
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "plantName";
        Sort sort = Sort.by(
                "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy);
        Pageable pageable = PageRequest.of(request.getPageNo(), request.getPageSize(), sort);

        Page<UserPlants> userPlantsPage;
        if (request.getUserId() != null && request.getKeywordOfCommonName() != null
                && !request.getKeywordOfCommonName().isEmpty()) {
            userPlantsPage = userPlantRepository.findByUserIdAndPlantNameContainingIgnoreCase(
                    request.getUserId(), request.getKeywordOfCommonName(), pageable);
        } else if (request.getUserId() != null) {
            userPlantsPage = userPlantRepository.findByUserId(
                    request.getUserId(), pageable);
        } else if (request.getKeywordOfCommonName() != null && !request.getKeywordOfCommonName().isEmpty()) {
            userPlantsPage = userPlantRepository.findByPlantNameContainingIgnoreCase(
                    request.getKeywordOfCommonName(), pageable);
        } else {
            userPlantsPage = userPlantRepository.findAll(pageable);
        }

        List<UserPlantsResponseDTO> dtos = userPlantsPage.getContent().stream()
                .map(this::convertToUserPlantsResponseDTO)
                .collect(Collectors.toList());

        return new UserPlantsSearchResponseDTO(
                dtos,
                userPlantsPage.getTotalElements(),
                userPlantsPage.getTotalPages(),
                request.getPageNo(),
                request.getPageSize());
    }

    @Override
    public UserPlantDetailResponseDTO getUserPlantDetail(Long plantId) {
        UserPlants userPlants = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("User Plant not found"));

        UserPlantDetailResponseDTO dto = new UserPlantDetailResponseDTO();
        dto.setUserPlantId(userPlants.getUserPlantId());
        dto.setPlantId(userPlants.getPlantId());
        dto.setNickname(userPlants.getPlantName());
        dto.setPlantingDate(userPlants.getPlantDate());
        dto.setLocationInHouse(userPlants.getPlantLocation());

        List<String> imageUrls = new ArrayList<>();
        List<UserPlantImageDetailDTO> imageDetails = new ArrayList<>();

        if (userPlants.getImages() != null) {
            for (UserPlantImage img : userPlants.getImages()) {
                imageUrls.add(img.getImageUrl());

                UserPlantImageDetailDTO imageDetail = new UserPlantImageDetailDTO();
                imageDetail.setId(img.getId());
                imageDetail.setImageUrl(img.getImageUrl());
                imageDetail.setDescription(img.getDescription());
                imageDetails.add(imageDetail);
            }
        }
        dto.setImageUrls(imageUrls);
        dto.setImages(imageDetails);

        return dto;
    }

    @Override
    public Page<UserPlantListResponseDTO> getAllUserPlants(int page, int size, Long userId) {
        Page<UserPlants> userPlantsPage = userPlantRepository.findByUserId(userId, PageRequest.of(page, size));
        return userPlantsPage.map(this::convertToUserPlantListResponseDTO);
    }

    @Override
    @Transactional
    public void deleteUserPlant(Long userPlantId, Long userId) {
        log.info("Attempting to delete user plant with ID: {} for user ID: {}", userPlantId, userId);

        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));

        List<CareLog> careLogs = careLogRepository.findByUserPlant_UserPlantIdOrderByCreatedAtDesc(userPlantId);
        if (!careLogs.isEmpty()) {
            log.info("Deleting {} care logs for user plant ID: {}", careLogs.size(), userPlantId);
            careLogRepository.deleteAll(careLogs);
        }

        List<CareSchedule> careSchedules = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId);
        if (!careSchedules.isEmpty()) {
            log.info("Deleting {} care schedules for user plant ID: {}", careSchedules.size(), userPlantId);
            careScheduleRepository.deleteAll(careSchedules);
        }

        if (userPlant.getImages() != null && !userPlant.getImages().isEmpty()) {
            log.info("Deleting {} user plant images for user plant ID: {}", userPlant.getImages().size(), userPlantId);
            deleteUserPlantImages(userPlant.getImages());
        }

        userPlantRepository.delete(userPlant);
        log.info("Successfully deleted user plant with ID: {} for user ID: {}", userPlantId, userId);
    }

    @Override
    public void addUserPlant(AddUserPlantRequestDTO requestDTO, List<MultipartFile> images, Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("User ID cannot be null or invalid");
        }

        if (requestDTO.getPlantId() == null) {
            throw new IllegalArgumentException("Plant ID cannot be null");
        }

        if (requestDTO.getNickname() == null || requestDTO.getNickname().trim().isEmpty()) {
            throw new IllegalArgumentException("Nickname cannot be null or empty");
        }

        if (requestDTO.getLocationInHouse() == null || requestDTO.getLocationInHouse().trim().isEmpty()) {
            throw new IllegalArgumentException("Location cannot be null or empty");
        }
        log.info("=== DEBUG SERVICE ADD USER PLANT ===");
        log.info("Request DTO: {}", requestDTO);
        log.info("Plant ID from request: {}", requestDTO.getPlantId());
        log.info("Nickname from request: {}", requestDTO.getNickname());
        log.info("Planting Date from request: {}", requestDTO.getPlantingDate());
        log.info("Location from request: {}", requestDTO.getLocationInHouse());
        log.info("User ID: {}", userId);
        log.info("================================");

        UserPlants userPlant = new UserPlants();
        userPlant.setUserId(userId);
        userPlant.setPlantId(requestDTO.getPlantId());
        userPlant.setPlantName(requestDTO.getNickname());

        Timestamp plantingTimestamp = null;
        if (requestDTO.getPlantingDate() != null && !requestDTO.getPlantingDate().trim().isEmpty()) {
            try {
                String dateStr = requestDTO.getPlantingDate();
                if (dateStr.endsWith("Z")) {
                    dateStr = dateStr.substring(0, dateStr.length() - 1); // Remove Z
                }
                plantingTimestamp = Timestamp.valueOf(dateStr.replace("T", " "));
                log.info("Successfully converted planting date: {} -> {}", requestDTO.getPlantingDate(),
                        plantingTimestamp);
            } catch (Exception e) {
                log.error("Failed to parse planting date: {}", requestDTO.getPlantingDate(), e);
                plantingTimestamp = new java.sql.Timestamp(System.currentTimeMillis());
            }
        } else {
            plantingTimestamp = new java.sql.Timestamp(System.currentTimeMillis());
        }

        userPlant.setPlantDate(plantingTimestamp);
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());
        userPlant.setCreated_at(new java.sql.Timestamp(System.currentTimeMillis()));

        log.info("=== DEBUG BEFORE SAVE ===");
        log.info("UserPlant object: {}", userPlant);
        log.info("Plant ID set: {}", userPlant.getPlantId());
        log.info("Plant Name set: {}", userPlant.getPlantName());
        log.info("Plant Date set: {}", userPlant.getPlantDate());
        log.info("Plant Location set: {}", userPlant.getPlantLocation());
        log.info("=========================");

        UserPlants savedUserPlant = userPlantRepository.save(userPlant);

        log.info("=== DEBUG AFTER SAVE ===");
        log.info("Saved UserPlant ID: {}", savedUserPlant.getUserPlantId());
        log.info("Saved Plant ID: {}", savedUserPlant.getPlantId());
        log.info("Saved Plant Name: {}", savedUserPlant.getPlantName());
        log.info("=========================");

        if (images != null && !images.isEmpty()) {
            saveUserPlantImages(savedUserPlant, images);
        }
    }

    private void saveUserPlantImages(UserPlants userPlant, List<MultipartFile> images) {
        log.info("Saving {} images for user plant ID: {}", images.size(), userPlant.getUserPlantId());

        String uploadDir = System.getProperty("file.upload-dir", "uploads/") + "user-plants/";
        Path uploadPath = Paths.get(uploadDir);

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            List<UserPlantImage> userPlantImages = new ArrayList<>();
            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) {
                    log.warn("Skipping empty image file");
                    continue;
                }

                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    log.warn("Skipping non-image file: {}", image.getOriginalFilename());
                    continue;
                }

                if (image.getSize() > 20 * 1024 * 1024) {
                    log.warn("Skipping file too large: {} ({} bytes)", image.getOriginalFilename(), image.getSize());
                    continue;
                }

                String originalFilename = image.getOriginalFilename();
                if (originalFilename == null) {
                    log.warn("Skipping file with null original filename");
                    continue;
                }

                String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String newFilename = UUID.randomUUID().toString() + fileExtension;

                Path filePath = uploadPath.resolve(newFilename);
                Files.copy(image.getInputStream(), filePath);

                String imageUrl = "/api/user-plants/" + newFilename;

                UserPlantImage userPlantImage = UserPlantImage.builder()
                        .userPlants(userPlant)
                        .imageUrl(imageUrl)
                        .description("User uploaded image for plant: " + userPlant.getPlantName())
                        .build();

                userPlantImages.add(userPlantImage);

                log.info("Saved image: {} -> {}", originalFilename, imageUrl);
            }
            if (!userPlantImages.isEmpty()) {
                userPlant.setImages(userPlantImages);
                userPlantRepository.save(userPlant);

                log.info("Successfully saved {} images for user plant ID: {}",
                        userPlantImages.size(), userPlant.getUserPlantId());
            }

        } catch (IOException e) {
            log.error("Error saving user plant images: {}", e.getMessage());
            throw new RuntimeException("Failed to save user plant images", e);
        }
    }

    private void deleteUserPlantImages(List<UserPlantImage> images) {
        String uploadDir = System.getProperty("file.upload-dir", "uploads/") + "user-plants/";

        for (UserPlantImage image : images) {
            try {
                String imageUrl = image.getImageUrl();
                if (imageUrl != null && imageUrl.startsWith("/api/user-plants/")) {
                    String filename = imageUrl.substring("/api/user-plants/".length());
                    Path filePath = Paths.get(uploadDir, filename);

                    if (Files.exists(filePath)) {
                        Files.delete(filePath);
                        log.info("Deleted image file: {}", filename);
                    } else {
                        log.warn("Image file not found: {}", filename);
                    }
                }
            } catch (IOException e) {
                log.error("Error deleting image file: {}", image.getImageUrl(), e);
            }
        }
    }

    @Override
    @Transactional
    public void updateUserPlant(UpdateUserPlantRequestDTO requestDTO, Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("User ID cannot be null or invalid");
        }
        log.info("Updating user plant: {} for user: {}", requestDTO.getUserPlantId(), userId);

        validateUpdateUserPlantRequest(requestDTO);

        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(requestDTO.getUserPlantId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));

        String oldNickname = userPlant.getPlantName();
        Timestamp oldPlantDate = userPlant.getPlantDate();
        String oldLocation = userPlant.getPlantLocation();

        userPlant.setPlantName(requestDTO.getNickname());
        userPlant.setPlantDate(requestDTO.getPlantingDate());
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());

        handleUserPlantImageUpdates(userPlant, requestDTO);

        userPlantRepository.save(userPlant);

        updateCareScheduleReminders(userPlant.getUserPlantId(), requestDTO.isReminderEnabled());

        log.info(
                "Successfully updated user plant: {} for user: {}. Changes: nickname='{}'->'{}', date='{}'->'{}', location='{}'->'{}'",
                requestDTO.getUserPlantId(), userId, oldNickname, requestDTO.getNickname(),
                oldPlantDate, requestDTO.getPlantingDate(), oldLocation, requestDTO.getLocationInHouse());
    }

    private void validateUpdateUserPlantRequest(UpdateUserPlantRequestDTO requestDTO) {
        if (requestDTO.getUserPlantId() == null) {
            throw new ValidationException("User plant ID is required");
        }

        if (requestDTO.getNickname() == null || requestDTO.getNickname().trim().isEmpty()) {
            throw new ValidationException("Nickname cannot be empty");
        }

        if (requestDTO.getPlantingDate() == null) {
            throw new ValidationException("Planting date is required");
        }

        if (requestDTO.getLocationInHouse() == null || requestDTO.getLocationInHouse().trim().isEmpty()) {
            throw new ValidationException("Location cannot be empty");
        }

        // Validate planting date is not in the future
        if (requestDTO.getPlantingDate().after(new Timestamp(System.currentTimeMillis()))) {
            throw new ValidationException("Planting date cannot be in the future");
        }

        // Validate image updates if provided
        if (requestDTO.getImageUpdates() != null && !requestDTO.getImageUpdates().isEmpty()) {
            validateImageUpdates(requestDTO.getImageUpdates());
        }

        // Validate image URLs if provided
        if (requestDTO.getImageUrls() != null && !requestDTO.getImageUrls().isEmpty()) {
            validateImageUrls(requestDTO.getImageUrls());
        }
    }

    private void validateImageUpdates(List<UserPlantImageUpdateDTO> imageUpdates) {
        for (UserPlantImageUpdateDTO update : imageUpdates) {
            if (update.getAction() == null || update.getAction().trim().isEmpty()) {
                throw new ValidationException("Image action is required");
            }

            if (!update.getAction().toUpperCase().matches("UPDATE|DELETE|ADD")) {
                throw new ValidationException("Invalid image action. Must be UPDATE, DELETE, or ADD");
            }

            if ("UPDATE".equals(update.getAction().toUpperCase())
                    || "DELETE".equals(update.getAction().toUpperCase())) {
                if (update.getImageId() == null) {
                    throw new ValidationException("Image ID is required for UPDATE and DELETE actions");
                }
            }

            if ("UPDATE".equals(update.getAction().toUpperCase()) || "ADD".equals(update.getAction().toUpperCase())) {
                if (update.getImageUrl() == null || update.getImageUrl().trim().isEmpty()) {
                    throw new ValidationException("Image URL is required for UPDATE and ADD actions");
                }
            }
        }
    }

    private void validateImageUrls(List<String> imageUrls) {
        for (String url : imageUrls) {
            if (url == null || url.trim().isEmpty()) {
                throw new ValidationException("Image URL cannot be empty");
            }
            if (!url.startsWith("/api/user-plants/")) {
                throw new ValidationException("Invalid image URL format. Must start with /api/user-plants/");
            }
        }
    }

    private void updateCareScheduleReminders(Long userPlantId, boolean reminderEnabled) {
        List<CareSchedule> careSchedules = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId);

        for (CareSchedule schedule : careSchedules) {
            schedule.setReminderEnabled(reminderEnabled);
        }

        if (!careSchedules.isEmpty()) {
            careScheduleRepository.saveAll(careSchedules);
            log.info("Updated reminder settings for {} care schedules of user plant: {}",
                    careSchedules.size(), userPlantId);
        }
    }

    private void handleUserPlantImageUpdates(UserPlants userPlant, UpdateUserPlantRequestDTO requestDTO) {
        // 1. Xử lý flexible image updates (ưu tiên)
        if (requestDTO.getImageUpdates() != null && !requestDTO.getImageUpdates().isEmpty()) {
            log.info("Processing flexible image updates for user plant: {}", userPlant.getUserPlantId());
            handleFlexibleUserPlantImageUpdates(userPlant, requestDTO.getImageUpdates());
        }
        // 2. Xử lý legacy image replacement
        else if (requestDTO.getImageUrls() != null) {
            log.info("Processing legacy image replacement for user plant: {}", userPlant.getUserPlantId());
            handleLegacyImageReplacement(userPlant, requestDTO.getImageUrls());
        }
        // 3. Nếu không có update ảnh, giữ nguyên ảnh cũ
        else {
            log.info("No image updates provided, keeping existing images for user plant: {}",
                    userPlant.getUserPlantId());
        }
    }

    private void handleFlexibleUserPlantImageUpdates(UserPlants userPlant, List<UserPlantImageUpdateDTO> imageUpdates) {
        for (UserPlantImageUpdateDTO update : imageUpdates) {
            switch (update.getAction().toUpperCase()) {
                case "UPDATE":

                    if (update.getImageId() != null) {
                        userPlant.getImages().stream()
                                .filter(img -> img.getId().equals(update.getImageId()))
                                .findFirst()
                                .ifPresent(img -> {
                                    img.setImageUrl(update.getImageUrl());
                                    if (update.getDescription() != null) {
                                        img.setDescription(update.getDescription());
                                    }
                                    log.info("Updated image ID: {} for user plant: {}", update.getImageId(),
                                            userPlant.getUserPlantId());
                                });
                    }
                    break;

                case "DELETE":
                    if (update.getImageId() != null) {
                        boolean removed = userPlant.getImages()
                                .removeIf(img -> img.getId().equals(update.getImageId()));
                        if (removed) {
                            log.info("Deleted image ID: {} for user plant: {}", update.getImageId(),
                                    userPlant.getUserPlantId());
                        }
                    }
                    break;

                case "ADD":
                    UserPlantImage newImage = UserPlantImage.builder()
                            .userPlants(userPlant)
                            .imageUrl(update.getImageUrl())
                            .description(
                                    update.getDescription() != null ? update.getDescription() : "User uploaded image")
                            .build();
                    userPlant.getImages().add(newImage);
                    log.info("Added new image for user plant: {}", userPlant.getUserPlantId());
                    break;

                default:
                    log.warn("Unknown image action: {} for user plant: {}", update.getAction(),
                            userPlant.getUserPlantId());
                    break;
            }
        }
    }

    private void handleLegacyImageReplacement(UserPlants userPlant, List<String> imageUrls) {
        if (userPlant.getImages() != null && !userPlant.getImages().isEmpty()) {
            log.info("Removing {} existing images for user plant: {}", userPlant.getImages().size(),
                    userPlant.getUserPlantId());
            userPlant.getImages().clear();
        }
        if (imageUrls != null && !imageUrls.isEmpty()) {
            List<UserPlantImage> newImages = new ArrayList<>();
            for (String imageUrl : imageUrls) {
                UserPlantImage newImage = UserPlantImage.builder()
                        .userPlants(userPlant)
                        .imageUrl(imageUrl)
                        .description("User uploaded image")
                        .build();
                newImages.add(newImage);
            }
            userPlant.getImages().addAll(newImages);
            log.info("Added {} new images for user plant: {}", newImages.size(), userPlant.getUserPlantId());
        }
    }

    @Override
    @Transactional
    public UserPlantResponseDTO createNewPlant(CreateUserPlantRequestDTO request, Long userId) {
        log.info("Creating new plant for user: {}", userId);

        userPlantValidator.validateUserPlant(request, userId);

        PlantCategory category = plantCategoryRepository.findById(Long.valueOf(request.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Plants newPlant = new Plants();
        newPlant.setScientificName(request.getScientificName());
        newPlant.setCommonName(request.getCommonName());
        newPlant.setCategory(category);
        newPlant.setDescription(request.getDescription());
        newPlant.setCareInstructions(request.getCareInstructions());
        newPlant.setLightRequirement(request.getLightRequirement());
        newPlant.setWaterRequirement(request.getWaterRequirement());
        newPlant.setCareDifficulty(request.getCareDifficulty());
        newPlant.setSuitableLocation(request.getSuitableLocation());
        newPlant.setCommonDiseases(request.getCommonDiseases());
        newPlant.setStatus(Plants.PlantStatus.ACTIVE);
        newPlant.setCreatedBy(userId);

        Plants savedPlant = plantRepository.save(newPlant);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            savePlantImages(savedPlant, request.getImageUrls());
        }

        UserPlants userPlant = new UserPlants();
        userPlant.setUserId(userId);
        userPlant.setPlantId(savedPlant.getId());
        userPlant.setPlantName(request.getCommonName());
        userPlant.setPlantDate(new java.sql.Timestamp(System.currentTimeMillis()));
        userPlant.setPlantLocation("Default location");
        userPlant.setCreated_at(new java.sql.Timestamp(System.currentTimeMillis()));
        userPlantRepository.save(userPlant);

        return convertToUserPlantResponseDTO(savedPlant, userPlant);
    }

    private void savePlantImages(Plants plant, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        List<PlantImage> plantImages = new ArrayList<>();

        for (int i = 0; i < imageUrls.size(); i++) {
            String url = imageUrls.get(i);
            PlantImage image = new PlantImage();
            image.setPlant(plant);
            image.setImageUrl(url);
            image.setIsPrimary(i == 0);
            plantImages.add(image);
        }

        plantImageRepository.saveAll(plantImages);

        plant.setImages(plantImages);
        plantRepository.save(plant);
    }

    private UserPlantResponseDTO convertToUserPlantResponseDTO(Plants plant, UserPlants userPlant) {
        UserPlantResponseDTO dto = new UserPlantResponseDTO();
        dto.setId(plant.getId());
        dto.setScientificName(plant.getScientificName());
        dto.setCommonName(plant.getCommonName());
        dto.setCategoryName(plant.getCategory().getName());
        dto.setDescription(plant.getDescription());
        dto.setCareInstructions(plant.getCareInstructions());
        dto.setLightRequirement(plant.getLightRequirement().toString());
        dto.setWaterRequirement(plant.getWaterRequirement().toString());
        dto.setCareDifficulty(plant.getCareDifficulty().toString());
        dto.setSuitableLocation(plant.getSuitableLocation());
        dto.setCommonDiseases(plant.getCommonDiseases());
        dto.setStatus(plant.getStatus().toString());
        dto.setCreatedAt(plant.getCreatedAt());
        dto.setCreatedBy(plant.getCreatedBy());
        dto.setUserCreated(plant.getCreatedBy() != null);

        // Set image URLs
        if (plant.getImages() != null) {
            List<String> imageUrls = plant.getImages().stream()
                    .map(PlantImage::getImageUrl)
                    .collect(Collectors.toList());
            dto.setImageUrls(imageUrls);
        }

        return dto;
    }

    private UserPlantsResponseDTO convertToUserPlantsResponseDTO(UserPlants userPlant) {
        return new UserPlantsResponseDTO(
                userPlant.getUserPlantId(),
                userPlant.getUserId(),
                userPlant.getPlantId(),
                userPlant.getPlantName(),
                userPlant.getPlantDate(),
                userPlant.getPlantLocation(),
                userPlant.getCreated_at());
    }

    private UserPlantListResponseDTO convertToUserPlantListResponseDTO(UserPlants userPlant) {
        UserPlantListResponseDTO dto = new UserPlantListResponseDTO();
        dto.setUserPlantId(userPlant.getUserPlantId());
        dto.setPlantId(userPlant.getPlantId());
        dto.setNickname(userPlant.getPlantName());
        dto.setPlantLocation(userPlant.getPlantLocation());
        if (userPlant.getImages() != null && !userPlant.getImages().isEmpty()) {
            dto.setImageUrl(userPlant.getImages().get(0).getImageUrl());
        }

        return dto;
    }
}