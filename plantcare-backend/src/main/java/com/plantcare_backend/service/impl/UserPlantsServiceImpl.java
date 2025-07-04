package com.plantcare_backend.service.impl;


import com.plantcare_backend.dto.response.userPlants.*;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.UserPlantImage;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.UserPlantsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPlantsServiceImpl implements UserPlantsService {
    @Autowired
    private final UserPlantRepository userPlantRepository;

    @Override
    public UserPlantsSearchResponseDTO searchUserPlants(UserPlantsSearchRequestDTO request) {
        String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "ASC";
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "plantName";
        Sort sort = Sort.by(
                "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy);
        Pageable pageable = PageRequest.of(request.getPageNo(), request.getPageSize(), sort);

        Page<UserPlants> userPlantsPage;
        if (request.getUserId() != null && request.getKeywordOfCommonName() != null && !request.getKeywordOfCommonName().isEmpty()) {
            userPlantsPage = userPlantRepository.findByUserIdAndPlantNameContainingIgnoreCase(
                    request.getUserId(), request.getKeywordOfCommonName(), pageable);
        } else if (request.getUserId() != null) {
            userPlantsPage = userPlantRepository.findByUserId(
                    request.getUserId(), pageable);
        } else if (request.getKeywordOfCommonName() != null && !request.getKeywordOfCommonName().isEmpty()) {
            userPlantsPage = userPlantRepository.findByPlantNameContainingIgnoreCase(
                    request.getKeywordOfCommonName(), pageable);
        } else {
            userPlantsPage = userPlantRepository.findAll(pageable);
        }

        List<UserPlantsResponseDTO> dtos = userPlantsPage.getContent().stream()
                .map(this::convertToUserPlantsResponseDTO)
                .collect(Collectors.toList());

        return new UserPlantsSearchResponseDTO(
                dtos,
                userPlantsPage.getTotalElements(),
                userPlantsPage.getTotalPages(),
                request.getPageNo(),
                request.getPageSize()
        );
    }

    @Override
    public List<UserPlants> getAllUserPlants() {
        return userPlantRepository.findAll();
    }

    @Override
    public UserPlantDetailResponseDTO getUserPlantDetail(Long plantId) {
        UserPlants userPlants = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("User Plant not found"));

        UserPlantDetailResponseDTO dto = new UserPlantDetailResponseDTO();
        dto.setUserPlantId(userPlants.getUserPlantId());
        dto.setPlantId(userPlants.getPlantId());
        dto.setNickname(userPlants.getPlantName());
        dto.setPlantingDate(userPlants.getPlantDate());
        dto.setLocationInHouse(userPlants.getPlantLocation());
        dto.setReminderEnabled(userPlants.isReminder_enabled());

        List<String> imageUrls = new ArrayList<>();
        List<UserPlantImageDetailDTO> imageDetails = new ArrayList<>();

        if (userPlants.getImages() != null) {
            for (UserPlantImage img : userPlants.getImages()) {
                imageUrls.add(img.getImageUrl());

                UserPlantImageDetailDTO imageDetail = new UserPlantImageDetailDTO();
                imageDetail.setId(img.getId());
                imageDetail.setImageUrl(img.getImageUrl());
                imageDetail.setDescription(img.getDescription());
                imageDetails.add(imageDetail);
            }
        }
        dto.setImageUrls(imageUrls);
        dto.setImages(imageDetails);

        return dto;
    }

    @Override
    public Page<UserPlantListResponseDTO> getAllUserPlants(int page, int size, Long userId) {
        Page<UserPlants> userPlantsPage = userPlantRepository.findByUserId(userId, PageRequest.of(page, size));
        return userPlantsPage.map(this::convertToUserPlantListResponseDTO);
    }

    @Override
    public void deleteUserPlant(Long userPlantId, Long userId) {
        log.info("Attempting to delete user plant with ID: {} for user ID: {}", userPlantId, userId);

        // Find the user plant
//        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId)
//                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        // Delete the user plant
        userPlantRepository.delete(userPlant);
        log.info("Successfully deleted user plant with ID: {} for user ID: {}", userPlantId, userId);
    }

    @Override
    public void addUserPlant(AddUserPlantRequestDTO requestDTO, Long userId) {
        UserPlants userPlant = new UserPlants();
        userPlant.setUserId(userId);
        userPlant.setPlantId(requestDTO.getPlantId());
        userPlant.setPlantName(requestDTO.getNickname());
        userPlant.setPlantDate(requestDTO.getPlantingDate());
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());
        userPlant.setReminder_enabled(requestDTO.isReminderEnabled());
        userPlant.setCreated_at(new java.sql.Timestamp(System.currentTimeMillis()));
        userPlantRepository.save(userPlant);
    }

    @Override
    public void updateUserPlant(UpdateUserPlantRequestDTO requestDTO, Long userId) {
        UserPlants userPlant = userPlantRepository.findByUserPlantIdAndUserId(requestDTO.getUserPlantId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));
        userPlant.setPlantName(requestDTO.getNickname());
        userPlant.setPlantDate(requestDTO.getPlantingDate());
        userPlant.setPlantLocation(requestDTO.getLocationInHouse());
        userPlant.setReminder_enabled(requestDTO.isReminderEnabled());
        userPlantRepository.save(userPlant);
    }

    private UserPlantsResponseDTO convertToUserPlantsResponseDTO(UserPlants userPlant) {
        return new UserPlantsResponseDTO(
                userPlant.getUserPlantId(),
                userPlant.getUserId(),
                userPlant.getPlantId(),
                userPlant.getPlantName(),
                userPlant.getPlantDate(),
                userPlant.getPlantLocation(),
                userPlant.isReminder_enabled(),
                userPlant.getCreated_at()
        );
    }

    private UserPlantListResponseDTO convertToUserPlantListResponseDTO(UserPlants userPlant) {
        UserPlantListResponseDTO dto = new UserPlantListResponseDTO();
        dto.setUserPlantId(userPlant.getUserPlantId());
        dto.setPlantId(userPlant.getPlantId());
        dto.setNickname(userPlant.getPlantName());
        dto.setPlantLocation(userPlant.getPlantLocation());
        dto.setReminderEnabled(userPlant.isReminder_enabled());
        return dto;
    }
} 