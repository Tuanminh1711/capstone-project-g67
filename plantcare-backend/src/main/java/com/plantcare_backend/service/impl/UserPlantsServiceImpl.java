package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.reponse.UserPlantsResponseDTO;
import com.plantcare_backend.dto.reponse.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
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
} 