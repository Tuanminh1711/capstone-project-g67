package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.user.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.sql.Timestamp;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test class for UserPlantsService update functionality
 * This test verifies that users can update both user plant details and original
 * plant details
 */
public class UserPlantsServiceUpdateTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantCategoryRepository plantCategoryRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private UpdateUserPlantRequestDTO updateRequest;
    private UserPlants userPlant;
    private Plants originalPlant;
    private PlantCategory category;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Setup test data
        updateRequest = new UpdateUserPlantRequestDTO();
        updateRequest.setUserPlantId(1L);
        updateRequest.setNickname("Updated Plant");
        updateRequest.setPlantingDate(new Timestamp(System.currentTimeMillis()));
        updateRequest.setLocationInHouse("Living Room");
        updateRequest.setReminderEnabled(true);

        // Plant detail updates
        updateRequest.setCategoryId(2L);
        updateRequest.setCareDifficulty("MODERATE");
        updateRequest.setLightRequirement("MEDIUM");
        updateRequest.setWaterRequirement("HIGH");
        updateRequest.setDescription("Updated description");
        updateRequest.setCareInstructions("Updated care instructions");

        // Setup user plant
        userPlant = new UserPlants();
        userPlant.setUserPlantId(1L);
        userPlant.setUserId(100L);
        userPlant.setPlantId(200L);
        userPlant.setPlantName("Old Plant");
        userPlant.setPlantDate(new Timestamp(System.currentTimeMillis() - 86400000)); // 1 day ago
        userPlant.setPlantLocation("Kitchen");

        // Setup original plant (user-created)
        originalPlant = new Plants();
        originalPlant.setId(200L);
        originalPlant.setCreatedBy(100L); // Same as user ID
        originalPlant.setScientificName("Test Plant");
        originalPlant.setCommonName("Test Plant");
        originalPlant.setCareDifficulty(Plants.CareDifficulty.EASY);
        originalPlant.setLightRequirement(Plants.LightRequirement.LOW);
        originalPlant.setWaterRequirement(Plants.WaterRequirement.LOW);

        // Setup category
        category = new PlantCategory();
        category.setId(2L);
        category.setName("Updated Category");
    }

    @Test
    void testUpdateUserPlantWithPlantDetails() {
        // Mock repository responses
        when(userPlantRepository.findByUserPlantIdAndUserId(1L, 100L))
                .thenReturn(Optional.of(userPlant));
        when(plantRepository.findById(200L))
                .thenReturn(Optional.of(originalPlant));
        when(plantCategoryRepository.findById(2L))
                .thenReturn(Optional.of(category));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenReturn(userPlant);
        when(plantRepository.save(any(Plants.class)))
                .thenReturn(originalPlant);

        // Execute update
        userPlantsService.updateUserPlant(updateRequest, 100L);

        // Verify user plant was updated
        verify(userPlantRepository).save(any(UserPlants.class));

        // Verify original plant was updated
        verify(plantRepository).save(any(Plants.class));

        // Verify category was fetched
        verify(plantCategoryRepository).findById(2L);
    }

    @Test
    void testUpdateUserPlantWithoutPlantDetails() {
        // Remove plant detail updates
        updateRequest.setCategoryId(null);
        updateRequest.setCareDifficulty(null);
        updateRequest.setLightRequirement(null);
        updateRequest.setWaterRequirement(null);
        updateRequest.setDescription(null);
        updateRequest.setCareInstructions(null);

        // Mock repository responses
        when(userPlantRepository.findByUserPlantIdAndUserId(1L, 100L))
                .thenReturn(Optional.of(userPlant));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenReturn(userPlant);

        // Execute update
        userPlantsService.updateUserPlant(updateRequest, 100L);

        // Verify user plant was updated
        verify(userPlantRepository).save(any(UserPlants.class));

        // Verify original plant was NOT updated (no plant details provided)
        verify(plantRepository, never()).save(any(Plants.class));
    }

    @Test
    void testUpdateUserPlantWithOfficialPlant() {
        // Make original plant an official plant (not user-created)
        originalPlant.setCreatedBy(null);

        // Mock repository responses
        when(userPlantRepository.findByUserPlantIdAndUserId(1L, 100L))
                .thenReturn(Optional.of(userPlant));
        when(plantRepository.findById(200L))
                .thenReturn(Optional.of(originalPlant));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenReturn(userPlant);

        // Execute update
        userPlantsService.updateUserPlant(updateRequest, 100L);

        // Verify user plant was updated
        verify(userPlantRepository).save(any(UserPlants.class));

        // Verify original plant was NOT updated (user doesn't have permission)
        verify(plantRepository, never()).save(any(Plants.class));
    }
}

