package com.example.plantcare_backend.service;



import com.example.plantcare_backend.dto.reponse.UserDetailResponse;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.dto.validator.UserStatus;

import java.util.List;

public interface UserService {

    long saveUser(UserRequestDTO userRequestDTO);

    void updateUser(int userId, UserRequestDTO userRequestDTO);

    void deleteUser(int userId);

    void changeStatus(int userId, UserStatus status);

    UserDetailResponse getUser(int userId);

    List<UserDetailResponse> getAllUsers(int pageNo, int pageSize);

}