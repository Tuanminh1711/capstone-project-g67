package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.reponse.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.reponse.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.PlantSearchRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.PlantManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class PlantManagementServiceImpl implements PlantManagementService {
    @Autowired
    private final PlantRepository plantRepository;
    @Autowired
    private final PlantCategoryRepository plantCategoryRepository;

    /**
     * Creates a new plant entry in the system by an admin or staff member.
     *
     * @param createPlantManagementRequestDTO the DTO containing all the plant details to be created.
     * @return the ID of the newly created plant.
     */
    @Override
    public Long createPlantByManager(CreatePlantManagementRequestDTO createPlantManagementRequestDTO) {
        PlantCategory plantCategory = plantCategoryRepository.findById(Long.valueOf(createPlantManagementRequestDTO.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        Plants plants = new Plants();
        plants.setScientificName(createPlantManagementRequestDTO.getScientificName());
        plants.setCommonName(createPlantManagementRequestDTO.getCommonName());
        plants.setCategory(plantCategory);
        plants.setDescription(createPlantManagementRequestDTO.getDescription());
        plants.setCareInstructions(createPlantManagementRequestDTO.getCareInstructions());
        plants.setLightRequirement(Plants.LightRequirement.valueOf(createPlantManagementRequestDTO.getLightRequirement()));
        plants.setWaterRequirement(Plants.WaterRequirement.valueOf(createPlantManagementRequestDTO.getWaterRequirement()));
        plants.setCareDifficulty(Plants.CareDifficulty.valueOf(createPlantManagementRequestDTO.getCareDifficulty()));
        plants.setSuitableLocation(createPlantManagementRequestDTO.getSuitableLocation());
        plants.setCommonDiseases(createPlantManagementRequestDTO.getCommonDiseases());
        plants.setStatus(Plants.PlantStatus.ACTIVE);

        Plants saved = plantRepository.save(plants);
        return saved.getId();
    }

    /**
     *
     * @param page
     * @param size
     * @return
     */
    @Override
    public Page<PlantListResponseDTO> getAllPlants(int page, int size) {
        Page<Plants> plantPage = plantRepository.findAll(PageRequest.of(page, size));
        return plantPage.map(this::toDTO);
    }

    @Override
    public Page<PlantListResponseDTO> searchPlants(PlantSearchRequestDTO dto) {
        Page<Plants> page = plantRepository.searchPlants(
                dto.getKeyword(),
                dto.getCategoryId(),
                dto.getLightRequirement() != null ? Plants.LightRequirement.valueOf(dto.getLightRequirement()) : null,
                dto.getWaterRequirement() != null ? Plants.WaterRequirement.valueOf(dto.getWaterRequirement()) : null,
                dto.getCareDifficulty() != null ? Plants.CareDifficulty.valueOf(dto.getCareDifficulty()) : null,
                dto.getStatus() != null ? Plants.PlantStatus.valueOf(dto.getStatus()) : null,
                PageRequest.of(dto.getPage(), dto.getSize())
        );
        return page.map(this::toDTO);
    }

    private PlantListResponseDTO toDTO(Plants plant) {
        PlantListResponseDTO dto = new PlantListResponseDTO();
        dto.setId(plant.getId());
        dto.setScientificName(plant.getScientificName());
        dto.setCommonName(plant.getCommonName());
        dto.setDescription(plant.getDescription());
        // Lấy 1 ảnh đại diện
        String imageUrl = null;
        if (plant.getImages() != null && !plant.getImages().isEmpty()) {
            PlantImage primary = plant.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .findFirst()
                    .orElse(null);
            if (primary != null) {
                imageUrl = primary.getImageUrl();
            } else {
                imageUrl = plant.getImages().get(0).getImageUrl();
            }
        }
        dto.setImageUrl(imageUrl);
        dto.setStatus(plant.getStatus());
        dto.setCreatedAt(plant.getCreatedAt());
        return dto;
    }
}
