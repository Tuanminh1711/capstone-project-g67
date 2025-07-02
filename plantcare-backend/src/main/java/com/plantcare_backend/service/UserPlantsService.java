package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.userPlants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantListResponseDTO;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.model.UserPlants;
import org.springframework.data.domain.Page;
import java.util.List;

public interface UserPlantsService {
    UserPlantsSearchResponseDTO searchUserPlants(UserPlantsSearchRequestDTO request);
    List<UserPlants> getAllUserPlants();
    Page<UserPlantListResponseDTO> getAllUserPlants(int page, int size, Long userId);
    void deleteUserPlant(Long userPlantId, Long userId);
    void addUserPlant(com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO requestDTO, Long userId);
    void updateUserPlant(com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO requestDTO, Long userId);

    UserPlantDetailResponseDTO getUserPlantDetail(Long userPlantId);
}