package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantListResponseDTO;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


public interface UserPlantsService {
    UserPlantsSearchResponseDTO searchUserPlants(UserPlantsSearchRequestDTO request);

    Page<UserPlantListResponseDTO> getAllUserPlants(int page, int size, Long userId);

    void deleteUserPlant(Long userPlantId, Long userId);

    void addUserPlant(com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO requestDTO, List<MultipartFile> images, Long userId);

    void updateUserPlant(com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO requestDTO, Long userId);

    UserPlantDetailResponseDTO getUserPlantDetail(Long userPlantId);

    UserPlantResponseDTO createNewPlant(CreateUserPlantRequestDTO request, Long userId);
}