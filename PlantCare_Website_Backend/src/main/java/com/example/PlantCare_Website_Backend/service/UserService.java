package com.example.PlantCare_Website_Backend.service;

import com.example.PlantCare_Website_Backend.dto.reponse.UserDetailResponse;
import com.example.PlantCare_Website_Backend.dto.request.UserRequestDTO;
import com.example.PlantCare_Website_Backend.dto.validator.UserStatus;

import java.util.List;

public interface UserService {

    long saveUser(UserRequestDTO userRequestDTO);

    void updateUser(int userId, UserRequestDTO userRequestDTO);

    void deleteUser(int userId);

    void changeStatus(int userId, UserStatus status);

    UserDetailResponse getUser(int userId);

    List<UserDetailResponse> getAllUsers(int pageNo, int pageSize);

}