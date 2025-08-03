package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.response.userPlants.*;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.dto.validator.UserPlantValidator;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.exception.ValidationException;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantImageRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.UserPlantsService;
import jakarta.transaction.Transactional;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
    public void deleteUserPlant(Long userPlantId, Long userId) {
        log.info("Attempting to delete user plant with ID: {} for user ID: {}", userPlantId, userId);

        // Find the user plant
        // UserPlants userPlant =
        // userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId)
        // .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        // Delete the user plant
        userPlantRepository.delete(userPlant);
        log.info("Successfully deleted user plant with ID: {} for user ID: {}", userPlantId, userId);
    }

    @Override
    public void addUserPlant(AddUserPlantRequestDTO requestDTO, List<MultipartFile> images, Long userId) {
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
        userPlant.setPlantDate(requestDTO.getPlantingDate());
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());

        // Sử dụng timestamp từ request nếu có, nếu không thì tạo mới
        if (requestDTO.getPlantingDate() != null) {
            userPlant.setCreated_at(requestDTO.getPlantingDate());
        } else {
            userPlant.setCreated_at(new java.sql.Timestamp(System.currentTimeMillis()));
        }

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
        userPlantRepository.save(userPlant);
    }

    private void saveUserPlantImages(UserPlants userPlant, List<MultipartFile> images) {
        log.info("Saving {} images for user plant ID: {}", images.size(), userPlant.getUserPlantId());

        String uploadDir = "uploads/user-plants/";
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

                if (image.getSize() > 5 * 1024 * 1024) {
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

    @Override
    public void updateUserPlant(UpdateUserPlantRequestDTO requestDTO, Long userId) {
        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(requestDTO.getUserPlantId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        userPlant.setPlantName(requestDTO.getNickname());
        userPlant.setPlantDate(requestDTO.getPlantingDate());
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());
        userPlantRepository.save(userPlant);
    }

    @Override
    @Transactional
    public UserPlantResponseDTO createNewPlant(CreateUserPlantRequestDTO request, Long userId) {
        log.info("Creating new plant for user: {}", userId);

        // 1. Validate request
        userPlantValidator.validateUserPlant(request, userId);

        // 2. Validate category exists
        PlantCategory category = plantCategoryRepository.findById(Long.valueOf(request.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // 3. Create new plant
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
        newPlant.setCreatedBy(userId); // Đánh dấu user tạo

        // 4. Save plant
        Plants savedPlant = plantRepository.save(newPlant);

        // 5. Handle images if any
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            savePlantImages(savedPlant, request.getImageUrls());
        }

        // 6. Add to user collection automatically
        UserPlants userPlant = new UserPlants();
        userPlant.setUserId(userId);
        userPlant.setPlantId(savedPlant.getId());
        userPlant.setPlantName(request.getCommonName()); // Default nickname
        userPlant.setPlantDate(new java.sql.Timestamp(System.currentTimeMillis()));
        userPlant.setPlantLocation("Default location");
        userPlant.setCreated_at(new java.sql.Timestamp(System.currentTimeMillis()));
        userPlantRepository.save(userPlant);

        // 7. Return response
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