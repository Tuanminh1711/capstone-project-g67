package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;

public interface UserProfileService {
    UserProfileRequestDTO getUserProfile(Integer userId);

    UserProfileRequestDTO updateUserProfile(Integer userId, UserProfileRequestDTO userProfileDTO);

}
