package com.plantcare_backend.service.impl;


import com.plantcare_backend.dto.request.plantsManager.PlantReportRequestDTO;
import com.plantcare_backend.dto.response.Plants.PlantResponseDTO;
import com.plantcare_backend.dto.response.Plants.PlantSearchResponseDTO;
import com.plantcare_backend.dto.response.Plants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.request.plants.CreatePlantRequestDTO;
import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.PlantService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantServiceImpl implements PlantService {

    @Autowired
    private final PlantRepository plantRepository;
    @Autowired
    private final PlantCategoryRepository categoryRepository;
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final PlantReportRepository plantReportRepository;


    /**
     * search plants filter
     *
     * @param request DTO chứa các tiêu chí tìm kiếm
     * @return plants
     */
    @Override
    public PlantSearchResponseDTO searchPlants(PlantSearchRequestDTO request) {
        log.info("Searching plants with criteria: {}", request);
        String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "ASC";
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "commonName";
        Sort sort = Sort.by(
                "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy);

        Pageable pageable = PageRequest.of(request.getPageNo(), request.getPageSize(), sort);
//        request.setStatus(Plants.PlantStatus.ACTIVE);

        Page<Plants> plantsPage = plantRepository.searchPlants(
                request.getKeyword(),
                request.getCategoryId(),
                request.getLightRequirement(),
                request.getWaterRequirement(),
                request.getCareDifficulty(),
                request.getStatus(),
                pageable);

        List<PlantResponseDTO> plantDTOs = plantsPage.getContent().stream()
                .map(this::convertToPlantResponseDTO)
                .collect(Collectors.toList());

        PlantSearchResponseDTO response = new PlantSearchResponseDTO();
        response.setPlants(plantDTOs);
        response.setTotalElements(plantsPage.getTotalElements());
        response.setTotalPages(plantsPage.getTotalPages());
        response.setCurrentPage(request.getPageNo());
        response.setPageSize(request.getPageSize());

        log.info("Found {} plants", plantsPage.getTotalElements());
        return response;
    }

    @Override
    public List<PlantCategory> getAllCategories() {
        log.info("Getting all plant categories");
        return categoryRepository.findAll();
    }

    @Override
    @Transactional
    public Long createPlant(CreatePlantRequestDTO request) {
        log.info("Creating new plant with scientific name: {}", request.getScientificName());

        PlantCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (plantRepository.existsByScientificNameIgnoreCase(request.getScientificName())) {
            throw new InvalidDataException("Plant with scientific name already exists: " + request.getScientificName());
        }

        Plants plant = Plants.builder()
                .scientificName(request.getScientificName())
                .commonName(request.getCommonName())
                .category(category)
                .description(request.getDescription())
                .careInstructions(request.getCareInstructions())
                .lightRequirement(request.getLightRequirement())
                .waterRequirement(request.getWaterRequirement())
                .careDifficulty(request.getCareDifficulty())
                .suitableLocation(request.getSuitableLocation())
                .commonDiseases(request.getCommonDiseases())
                .status(Plants.PlantStatus.ACTIVE)
                .build();

        Plants savedPlant = plantRepository.save(plant);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<PlantImage> images = request.getImageUrls().stream()
                    .map(url -> PlantImage.builder()
                            .plant(savedPlant)
                            .imageUrl(url)
                            .isPrimary(false)
                            .build())
                    .collect(Collectors.toList());

            if (!images.isEmpty()) {
                images.get(0).setIsPrimary(true);
            }
            savedPlant.setImages(images);
            plantRepository.save(savedPlant);
        }

        log.info("Plant created successfully with ID: {}", savedPlant.getId());
        return savedPlant.getId();
    }

    public PlantDetailResponseDTO getPlantDetail(Long plantId) {
        Plants plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        PlantDetailResponseDTO dto = new PlantDetailResponseDTO();
        dto.setId(plant.getId());
        dto.setScientificName(plant.getScientificName());
        dto.setCommonName(plant.getCommonName());
        dto.setDescription(plant.getDescription());
        dto.setCareInstructions(plant.getCareInstructions());
        dto.setSuitableLocation(plant.getSuitableLocation());
        dto.setCommonDiseases(plant.getCommonDiseases());
        dto.setStatus(plant.getStatus() != null ? plant.getStatus().name() : null);
        dto.setStatusDisplay(getStatusDisplay(plant.getStatus()));
        dto.setCreatedAt(plant.getCreatedAt());
        dto.setUpdatedAt(plant.getUpdatedAt());
        dto.setCategoryName(plant.getCategory() != null ? plant.getCategory().getName() : null);

        // Lấy danh sách ảnh
        List<String> imageUrls = new ArrayList<>();
        if (plant.getImages() != null) {
            for (PlantImage img : plant.getImages()) {
                imageUrls.add(img.getImageUrl());
            }
        }
        dto.setImageUrls(imageUrls);

        return dto;
    }

    @Override
    public UserPlantDetailResponseDTO toUserPlantDetailDTO(PlantDetailResponseDTO dto) {
        UserPlantDetailResponseDTO userDto = new UserPlantDetailResponseDTO();
        userDto.setId(dto.getId());
        userDto.setScientificName(dto.getScientificName());
        userDto.setCommonName(dto.getCommonName());
        userDto.setDescription(dto.getDescription());
        userDto.setCareInstructions(dto.getCareInstructions());
        userDto.setSuitableLocation(dto.getSuitableLocation());
        userDto.setCommonDiseases(dto.getCommonDiseases());
        userDto.setStatus(dto.getStatus());
        userDto.setCategoryName(dto.getCategoryName());
        userDto.setImageUrls(dto.getImageUrls());
        return userDto;
    }

    private String getStatusDisplay(Plants.PlantStatus status) {
        if (status == null) return "";
        switch (status) {
            case ACTIVE: return "Đang hoạt động";
            case INACTIVE: return "Không hoạt động";
            default: return status.name();
        }
    }


    /**
     * Process a plant report from a user.
     *
     * @param request The DTO contains report information, including plant ID and reason.
     * @param reporterId User ID of the report.
     */
    @Override
    public void reportPlant(PlantReportRequestDTO request, Long reporterId) {
        // 1. Lấy thông tin user
        Users reporter = userRepository.findById(Math.toIntExact(reporterId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 2. Lấy thông tin plant
        Plants plant = plantRepository.findById(request.getPlantId())
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));
        // Kiểm tra trạng thái plant
        if (plant.getStatus() == Plants.PlantStatus.INACTIVE) {
            throw new IllegalArgumentException("Cây này đã bị khóa do bị report quá nhiều!");
        }

        // 4. Kiểm tra user đã report chưa
        if (plantReportRepository.existsByPlantAndReporterAndStatus(plant, reporter,
                PlantReport.ReportStatus.PENDING)) {
            throw new IllegalArgumentException("Bạn đã report cây này rồi! vui lòng chờ xử lý.");
        }

        // 3. Tạo report mới
        PlantReport report = PlantReport.builder()
                .plant(plant)
                .reporter(reporter)
                .reason(request.getReason())
                .status(PlantReport.ReportStatus.PENDING)
                .build();
        plantReportRepository.save(report);

        // 4. Đếm số lượng report của plant này
        int reportCount = plantReportRepository.countByPlantId(plant.getId());

        // 5. Nếu >= 2, chuyển plant sang INACTIVE
        if (reportCount >= 2 && plant.getStatus() != Plants.PlantStatus.INACTIVE) {
            plant.setStatus(Plants.PlantStatus.INACTIVE);
            plantRepository.save(plant);
        }

        // 6. Gửi email cho staff và admin
//        List<Users> staffAndAdmins = userRepository.findByRoleIn(List.of("ADMIN", "STAFF"));
//        for (Users user : staffAndAdmins) {
//            emailService.sendEmail(
//                    user.getEmail(),
//                    "Có báo cáo mới về cây cảnh",
//                    "Xin chào " + user.getUsername() + ",\n\n" +
//                            "Cây: " + plant.getCommonName() + "\n" +
//                            "Người báo cáo: " + reporter.getUsername() + "\n" +
//                            "Lý do báo cáo:\n" +
//                            request.getReason() + "\n\n" +
//                            "Vui lòng kiểm tra và xử lý báo cáo này sớm.\n\n" +
//                            "Trân trọng,\n" +
//                            "Hệ thống PlantCare"
//            );
    }
    /**
     * Chuyển đổi Plants entity sang PlantResponseDTO
     */
    private PlantResponseDTO convertToPlantResponseDTO(Plants plant) {
        PlantResponseDTO dto = new PlantResponseDTO();
        dto.setId(plant.getId());
        dto.setScientificName(plant.getScientificName());
        dto.setCommonName(plant.getCommonName());
        dto.setCategoryName(plant.getCategory() != null ? plant.getCategory().getName() : null);
        dto.setDescription(plant.getDescription());
        dto.setCareInstructions(plant.getCareInstructions());
        dto.setLightRequirement(plant.getLightRequirement());
        dto.setWaterRequirement(plant.getWaterRequirement());
        dto.setCareDifficulty(plant.getCareDifficulty());
        dto.setSuitableLocation(plant.getSuitableLocation());
        dto.setCommonDiseases(plant.getCommonDiseases());
        dto.setStatus(plant.getStatus());
        dto.setCreatedAt(plant.getCreatedAt());

        if (plant.getImages() != null && !plant.getImages().isEmpty()) {
            List<String> imageUrls = plant.getImages().stream()
                    .map(image -> image.getImageUrl())
                    .collect(Collectors.toList());
            dto.setImageUrls(imageUrls);
        }

        return dto;
    }
}
