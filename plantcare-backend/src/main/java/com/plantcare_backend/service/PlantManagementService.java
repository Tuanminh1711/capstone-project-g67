package com.plantcare_backend.service;

import com.plantcare_backend.dto.reponse.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.PlantSearchRequestDTO;
import com.plantcare_backend.model.Plants;
import org.springframework.data.domain.Page;

public interface PlantManagementService {
    Long createPlantByManager(CreatePlantManagementRequestDTO createPlantManagementRequestDTO);
    Page<PlantListResponseDTO> getAllPlants(int page, int size);
    Page<PlantListResponseDTO> searchPlants(PlantSearchRequestDTO plantSearchRequestDTO);
}
