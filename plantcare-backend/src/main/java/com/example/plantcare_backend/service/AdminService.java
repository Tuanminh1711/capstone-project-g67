package com.example.plantcare_backend.service;



import com.example.plantcare_backend.dto.reponse.UserDetailResponse;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.dto.validator.UserStatus;
import com.example.plantcare_backend.model.Plants;
import com.example.plantcare_backend.model.Users;

import java.util.List;

/**
 * Create by TaHoang
 */

public interface AdminService {

    long saveUser(UserRequestDTO userRequestDTO);

    void updateUser(int userId, UserRequestDTO userRequestDTO);

    void deleteUser(int userId);

    void changeStatus(int userId, Users.UserStatus status);


    UserDetailResponse getUser(int userId);

    List<UserDetailResponse> getAllUsers(int pageNo, int pageSize);

    // Get total number of plants
    long getTotalPlants();

    // Get total plants by status (ACTIVE/INACTIVE)
    long getTotalPlantsByStatus(Plants.PlantStatus status);

    // Get paginated list of plants
    List<Plants> getAllPlants(int pageNo, int pageSize);

}