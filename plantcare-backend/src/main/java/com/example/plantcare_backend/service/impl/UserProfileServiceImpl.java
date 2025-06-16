package com.example.plantcare_backend.service.impl;

import com.example.plantcare_backend.dto.request.UserProfileRequestDTO;
import com.example.plantcare_backend.exception.ResourceNotFoundException;
import com.example.plantcare_backend.model.UserProfile;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.UserProfileRepository;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.UserProfileService;
import com.example.plantcare_backend.util.Gender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserProfileRequestDTO getUserProfile(Integer userId) {
        log.info("Getting user profile for userId: {}", userId);
        try {
            UserProfile userProfile = userProfileRepository.findUserProfileDetails(userId);
            if (userProfile == null) {
                log.error("User profile not found for userId: {}", userId);
                throw new ResourceNotFoundException("User profile not found for userId: " + userId);
            }
            Users user = userProfile.getUser();
            log.info("Found user profile for userId: {}", userId);

            return convertToDTO(user, userProfile);
        } catch (Exception e) {
            log.error("Error getting user profile for userId: {}", userId, e);
            throw e;
        }
    }

    @Override
    public UserProfileRequestDTO getUserProfileByUsername(String username) {
        log.info("Getting user profile for username: {}", username);
        try {
            Users user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

            UserProfile userProfile = userProfileRepository.findByUser(user);
            if (userProfile == null) {
                log.error("User profile not found for username: {}", username);
                throw new ResourceNotFoundException("User profile not found for username: " + username);
            }

            log.info("Found user profile for username: {}", username);
            return convertToDTO(user, userProfile);
        } catch (Exception e) {
            log.error("Error getting user profile for username: {}", username, e);
            throw e;
        }
    }

    @Override
    public UserProfileRequestDTO updateUserProfileByUsername(String username, UserProfileRequestDTO userProfileDTO) {
        log.info("Updating user profile for username: {}", username);
        try {
            Users user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

            UserProfile userProfile = userProfileRepository.findByUser(user);
            if (userProfile == null) {
                log.error("User profile not found for username: {}", username);
                throw new ResourceNotFoundException("User profile not found for username: " + username);
            }
            userProfile.setFullName(userProfileDTO.getFullName());
            userProfile.setPhone(userProfileDTO.getPhoneNumber());
            userProfile.setLivingEnvironment(userProfileDTO.getLivingEnvironment());
            userProfile.setAvatarUrl(userProfileDTO.getAvatar());
            if (userProfileDTO.getGender() != null) {
                userProfile.setGender(Gender.valueOf(userProfileDTO.getGender()));
            }

            UserProfile updatedProfile = userProfileRepository.save(userProfile);
            log.info("Updated user profile for username: {}", username);

            return convertToDTO(user, updatedProfile);
        } catch (Exception e) {
            log.error("Error updating user profile for username: {}", username, e);
            throw e;
        }
    }

    @Override
    public UserProfileRequestDTO updateUserProfile(Long userId, UserProfileRequestDTO userProfileDTO) {
        return null;
    }

    @Override
    public void deleteUserProfile(Long userId) {

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
