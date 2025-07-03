package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.Plants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.model.UserPlants;
import java.util.List;

public interface UserPlantsService {
    UserPlantsSearchResponseDTO searchUserPlants(UserPlantsSearchRequestDTO request);
    List<UserPlants> getAllUserPlants();
    void deleteUserPlant(Long userPlantId, Long userId);
    void addUserPlant(com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO requestDTO, Long userId);
} 