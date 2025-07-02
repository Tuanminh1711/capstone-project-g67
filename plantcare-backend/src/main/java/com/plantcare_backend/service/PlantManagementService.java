package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportListResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.PlantReportSearchRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.PlantSearchRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.UpdatePlantRequestDTO;
import com.plantcare_backend.model.Plants;
import org.springframework.data.domain.Page;

public interface PlantManagementService {
    Long createPlantByManager(CreatePlantManagementRequestDTO createPlantManagementRequestDTO);

    Page<PlantListResponseDTO> getAllPlants(int page, int size);

    Page<PlantListResponseDTO> searchPlants(PlantSearchRequestDTO plantSearchRequestDTO);

    PlantDetailResponseDTO updatePlant(Long plantId, UpdatePlantRequestDTO updateRequest);

    PlantDetailResponseDTO getPlantDetail(Long plantId);

    Plants.PlantStatus lockOrUnlockPlant(Long plantId, boolean lock);

    PlantReportListResponseDTO getReportList(PlantReportSearchRequestDTO request);
}
