package com.plantcare_backend.service.impl.user;

import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;
import com.plantcare_backend.dto.response.auth.UpdateAvatarResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.UserProfileService;
import com.plantcare_backend.util.Gender;
import com.plantcare_backend.service.AzureStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {
    @Autowired
    private final UserProfileRepository userProfileRepository;
    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private AzureStorageService azureStorageService;

    // UPLOAD_DIR constant removed - now using Azure Storage

    @Override
    public UserProfileRequestDTO getUserProfile(Integer userId) {
        log.info("Fetching user profile for userId: {}", userId);

        UserProfile userProfile = userProfileRepository.findUserProfileDetails(userId)
                .orElseThrow(() -> {
                    log.error("User profile not found for userId: {}", userId);
                    return new ResourceNotFoundException("User profile not found");
                });

        Users user = userProfile.getUser();
        return convertToDTO(user, userProfile);
    }

    @Override
    public UserProfileRequestDTO updateUserProfile(Integer userId, UserProfileRequestDTO userProfileDTO) {
        log.info("Updating profile for user ID: {}", userId);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user ID: " + userId));

        if (userProfileDTO.getFullName() == null || userProfileDTO.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name cannot be empty");
        }
        if (userProfileDTO.getGender() == null || userProfileDTO.getGender().trim().isEmpty()) {
            throw new IllegalArgumentException("Gender cannot be null or empty");
        }
        if (userProfileDTO.getLivingEnvironment() == null || userProfileDTO.getLivingEnvironment().trim().isEmpty()) {
            throw new IllegalArgumentException("Living environment cannot be null or empty");
        }
        userProfile.setFullName(userProfileDTO.getFullName());
        userProfile.setPhone(userProfileDTO.getPhoneNumber());
        userProfile.setLivingEnvironment(userProfileDTO.getLivingEnvironment());

        if (userProfileDTO.getGender() != null) {
            try {
                userProfile.setGender(Gender.valueOf(userProfileDTO.getGender()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid gender value: " + userProfileDTO.getGender());
            }
        }
        UserProfile updatedProfile = userProfileRepository.save(userProfile);
        return convertToDTO(user, updatedProfile);
    }

    @Override
    public UpdateAvatarResponseDTO updateAvatar(Integer userId, MultipartFile avatar) {
        log.info("Updating avatar for user ID: {}", userId);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user ID: " + userId));

        // Validate avatar URL
        if (avatar == null || avatar.isEmpty()) {
            throw new IllegalArgumentException("Avatar file cannot be empty");
        }
        String contentType = avatar.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }
        if (avatar.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 5MB");
        }

        try {
            // Tạo unique filename
            String originalFilename = avatar.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Upload to Azure Storage
            String path = "avatars/" + newFilename;
            String avatarUrl = azureStorageService.uploadFile(avatar, path);

            // Xóa avatar cũ nếu có
            String oldAvatarUrl = userProfile.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
                try {
                    // Extract path from old avatar URL and delete from Azure
                    if (oldAvatarUrl.contains("/")) {
                        String oldPath = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf("/") + 1);
                        azureStorageService.deleteFile("avatars/" + oldPath);
                    }
                } catch (Exception e) {
                    log.warn("Failed to delete old avatar: {}", e.getMessage());
                }
            }

            // Cập nhật database
            userProfile.setAvatarUrl(avatarUrl);
            userProfileRepository.save(userProfile);

            return new UpdateAvatarResponseDTO(avatarUrl, "Avatar updated successfully");

        } catch (IOException e) {
            log.error("Error saving avatar file: {}", e.getMessage());
            throw new RuntimeException("Failed to save avatar file", e);
        }
    }

    @Override
    public String getUserAvatarUrl(Integer userId) {
        log.info("Getting avatar URL for user ID: {}", userId);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user ID: " + userId));

        return userProfile.getAvatarUrl();
    }

    private UserProfileRequestDTO convertToDTO(Users user, UserProfile userProfile) {
        UserProfileRequestDTO dto = new UserProfileRequestDTO();
        dto.setId((long) user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(userProfile.getFullName());
        dto.setPhoneNumber(userProfile.getPhone());
        dto.setLivingEnvironment(userProfile.getLivingEnvironment());
        dto.setGender(userProfile.getGender() != null ? userProfile.getGender().toString() : null);
        dto.setAvatar(userProfile.getAvatarUrl());
        return dto;
    }
}
