package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.reponse.PlantResponseDTO;
import com.plantcare_backend.dto.reponse.PlantSearchResponseDTO;
import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.PlantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
