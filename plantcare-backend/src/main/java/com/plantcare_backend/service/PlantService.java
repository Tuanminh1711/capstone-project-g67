package com.plantcare_backend.service;

import com.plantcare_backend.dto.reponse.Plants.PlantSearchResponseDTO;
import com.plantcare_backend.dto.reponse.Plants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.reponse.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.request.plants.CreatePlantRequestDTO;
import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.model.PlantCategory;

import java.util.List;

public interface PlantService {
    PlantSearchResponseDTO searchPlants(PlantSearchRequestDTO request);

    List<PlantCategory> getAllCategories();

    Long createPlant(CreatePlantRequestDTO request);

    PlantDetailResponseDTO getPlantDetail(Long plantId);

    UserPlantDetailResponseDTO toUserPlantDetailDTO(PlantDetailResponseDTO dto);
}

