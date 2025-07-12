package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;
import com.plantcare_backend.dto.response.auth.UpdateAvatarResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {
    UserProfileRequestDTO getUserProfile(Integer userId);

    UserProfileRequestDTO updateUserProfile(Integer userId, UserProfileRequestDTO userProfileDTO);

    UpdateAvatarResponseDTO updateAvatar(Integer userId, MultipartFile avatarUrl);

    String getUserAvatarUrl(Integer userId);
}
