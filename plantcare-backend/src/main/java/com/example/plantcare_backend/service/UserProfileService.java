package com.example.plantcare_backend.service;

import com.example.plantcare_backend.dto.request.UserProfileRequestDTO;

public interface UserProfileService {
    UserProfileRequestDTO getUserProfile(Integer userId);

    UserProfileRequestDTO getUserProfileByUsername(String username);

    UserProfileRequestDTO updateUserProfileByUsername(String username, UserProfileRequestDTO userProfileDTO);

    UserProfileRequestDTO updateUserProfile(Long userId, UserProfileRequestDTO userProfileDTO);

    void deleteUserProfile(Long userId);
}
