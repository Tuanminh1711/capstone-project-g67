package com.plantcare_backend.service.plantManagementServiceTest;

import com.plantcare_backend.dto.request.plantsManager.UpdatePlantRequestDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdatePlantTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantCategoryRepository plantCategoryRepository;

    @Spy
    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private Plants existingPlant;
    private PlantCategory category;
    private UpdatePlantRequestDTO updateRequest;
    private PlantDetailResponseDTO result;

    private static Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        existingPlant = new Plants();
        existingPlant.setId(1L);
        existingPlant.setImages(new ArrayList<>());

        category = new PlantCategory();
        category.setId(2L);

        updateRequest = new UpdatePlantRequestDTO();
        updateRequest.setScientificName("Updated Scientific");
        updateRequest.setCommonName("Updated Common");
        updateRequest.setCategoryId(2L);
        updateRequest.setDescription("Updated Description");
        updateRequest.setCareInstructions("Updated Care");
        updateRequest.setLightRequirement("LOW");
        updateRequest.setWaterRequirement("MEDIUM");
        updateRequest.setCareDifficulty("EASY");
        updateRequest.setSuitableLocation("Living room");
        updateRequest.setCommonDiseases("None");
        updateRequest.setStatus("ACTIVE");
        updateRequest.setImageUrls(Arrays.asList("url1.jpg", "url2.jpg"));
    }

    @Test
    void updatePlant_success_withNewImages() {
        try {
            when(plantRepository.findById(1L)).thenReturn(Optional.of(existingPlant));
            when(plantCategoryRepository.findById(2L)).thenReturn(Optional.of(category));
            when(plantRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            doReturn(new PlantDetailResponseDTO()).when(plantManagementService).getPlantDetail(1L);

            result = plantManagementService.updatePlant(1L, updateRequest);

            assertNotNull(result);
            verify(plantRepository).save(existingPlant);
            System.out.println("Test 'updatePlant_success_withNewImages' thành công");
        } catch (Exception e) {
            fail("Test 'updatePlant_success_withNewImages' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updatePlant_notFoundPlant_throwsException() {
        when(plantRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> plantManagementService.updatePlant(1L, updateRequest));

        assertEquals("Plant not found with id: 1", ex.getMessage());
        System.out.println("Test 'updatePlant_notFoundPlant_throwsException' thành công");
    }

    @Test
    void updatePlant_notFoundCategory_throwsException() {
        when(plantRepository.findById(1L)).thenReturn(Optional.of(existingPlant));
        when(plantCategoryRepository.findById(2L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> plantManagementService.updatePlant(1L, updateRequest));

        assertEquals("Category not found", ex.getMessage());
        System.out.println("Test 'updatePlant_notFoundCategory_throwsException' thành công");
    }

    @Test
    void updatePlant_noImageUpdatesOrImageUrls_maintainsOldImages() {
        updateRequest.setImageUrls(null);
        updateRequest.setImageUpdates(null);

        List<PlantImage> oldImages = new ArrayList<>();
        oldImages.add(PlantImage.builder().id(1L).imageUrl("old1.jpg").isPrimary(true).plant(existingPlant).build());
        existingPlant.setImages(oldImages);

        when(plantRepository.findById(1L)).thenReturn(Optional.of(existingPlant));
        when(plantCategoryRepository.findById(2L)).thenReturn(Optional.of(category));
        when(plantRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doReturn(new PlantDetailResponseDTO()).when(plantManagementService).getPlantDetail(1L);

        PlantDetailResponseDTO result = plantManagementService.updatePlant(1L, updateRequest);

        assertNotNull(result);
        assertEquals(1, existingPlant.getImages().size());
        assertEquals("old1.jpg", existingPlant.getImages().get(0).getImageUrl());
        System.out.println("Test 'updatePlant_noImageUpdatesOrImageUrls_maintainsOldImages' thành công");
    }

    @Test
    void updatePlant_shouldThrowException_whenScientificNameAlreadyExists() {
        // Given
        updateRequest.setScientificName("DuplicateScienceName");
        updateRequest.setCommonName("UniqueCommonName");

        Plants existingPlant = new Plants();
        existingPlant.setId(1L);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(existingPlant));
        when(plantCategoryRepository.findById(anyLong())).thenReturn(Optional.of(new PlantCategory()));

        when(plantRepository.existsByScientificNameIgnoreCase("DuplicateScienceName")).thenReturn(true);

        InvalidDataException exception = assertThrows(InvalidDataException.class, () ->
                plantManagementService.updatePlant(1L, updateRequest));

        assertEquals("Scientific name already exists", exception.getMessage());
        System.out.println("Test 'updatePlant_shouldThrowException_whenScientificNameAlreadyExists' passed.");
    }

    @Test
    void validFields_shouldPassValidation() {
        UpdatePlantRequestDTO dto = new UpdatePlantRequestDTO();
        dto.setScientificName("Scientific");
        dto.setCommonName("Common");
        dto.setCategoryId(1L);
        dto.setLightRequirement("LOW");
        dto.setWaterRequirement("MEDIUM");
        dto.setCareDifficulty("EASY");
        dto.setStatus("ACTIVE");

        Set<ConstraintViolation<UpdatePlantRequestDTO>> violations = validator.validate(dto);

        assertTrue(violations.isEmpty());
        System.out.println("✅ Validation passed for valid DTO");
    }
}
