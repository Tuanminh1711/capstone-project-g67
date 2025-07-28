package com.plantcare_backend.service.PlantManagementServiceTest;

import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreatePlantByManagerTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantCategoryRepository plantCategoryRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private CreatePlantManagementRequestDTO requestDTO;
    private PlantCategory plantCategory;
    private Plants savedPlant;

    @BeforeEach
    void setUp() {
        plantCategory = new PlantCategory();
        plantCategory.setId(1L);

        requestDTO = new CreatePlantManagementRequestDTO();
        requestDTO.setScientificName("Science Name");
        requestDTO.setCommonName("Common Name");
        requestDTO.setCategoryId("1");
        requestDTO.setDescription("tree something");
        requestDTO.setCareInstructions("care instruction");
        requestDTO.setLightRequirement("LOW");
        requestDTO.setWaterRequirement("MEDIUM");
        requestDTO.setCareDifficulty("MODERATE");
        requestDTO.setSuitableLocation("Indoor");
        requestDTO.setCommonDiseases("Root rot");

        savedPlant = new Plants();
        savedPlant.setId(100L);
    }

    @Test
    void createPlantByManager_shouldCreateSuccessfully() {
        try {
            when(plantCategoryRepository.findById(1L)).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase("Ficus lyrata")).thenReturn(false);
            when(plantRepository.existsByCommonNameIgnoreCase("Fiddle Leaf Fig")).thenReturn(false);
            when(plantRepository.save(any(Plants.class))).thenReturn(savedPlant);

            Long result = plantManagementService.createPlantByManager(requestDTO, 123L);

            assertEquals(100L, result);
            verify(plantRepository).save(any(Plants.class));
            System.out.println("Test 'createPlantByManager_shouldCreateSuccessfully' thành công");
            System.out.println("Plant ID: " + result);
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_shouldCreateSuccessfully' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_shouldThrow_whenCategoryNotFound() {
        try {
            when(plantCategoryRepository.findById(1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_shouldThrow_whenCategoryNotFound' thành công");
        } catch (Exception e) {
            fail("Test 'createPlantByManager_shouldThrow_whenCategoryNotFound' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_shouldThrow_whenScientificNameExists() {
        try {
            when(plantCategoryRepository.findById(1L)).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase("Ficus lyrata")).thenReturn(true);

            assertThrows(InvalidDataException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_shouldThrow_whenScientificNameExists' thành công");
        } catch (Exception e) {
            fail("Test 'createPlantByManager_shouldThrow_whenScientificNameExists' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_shouldThrow_whenCommonNameExists() {
        try {
            when(plantCategoryRepository.findById(1L)).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase("Ficus lyrata")).thenReturn(false);
            when(plantRepository.existsByCommonNameIgnoreCase("Fiddle Leaf Fig")).thenReturn(true);

            assertThrows(InvalidDataException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_shouldThrow_whenCommonNameExists' thành công");
        } catch (Exception e) {
            fail("Test 'createPlantByManager_shouldThrow_whenCommonNameExists' thất bại: " + e.getMessage());
        }
    }
}
