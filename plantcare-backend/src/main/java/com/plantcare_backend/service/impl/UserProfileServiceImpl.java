package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.UserProfileRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.UserProfileService;
import com.plantcare_backend.util.Gender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

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
        userProfile.setFullName(userProfileDTO.getFullName());
        userProfile.setPhone(userProfileDTO.getPhoneNumber());
        userProfile.setLivingEnvironment(userProfileDTO.getLivingEnvironment());
        userProfile.setAvatarUrl(userProfileDTO.getAvatar());

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


    private UserProfileRequestDTO convertToDTO(Users user, UserProfile userProfile) {
        UserProfileRequestDTO dto = new UserProfileRequestDTO();
        dto.setId((long) user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(userProfile.getFullName());
        dto.setPhoneNumber(userProfile.getPhone());
        dto.setLivingEnvironment(userProfile.getLivingEnvironment());
        dto.setAvatar(userProfile.getAvatarUrl());
        dto.setGender(userProfile.getGender() != null ? userProfile.getGender().toString() : null);
        return dto;
    }
}
