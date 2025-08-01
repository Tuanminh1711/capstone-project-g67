package com.plantcare_backend.service.plantManagementServiceTest;

import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.Plants;
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
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

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

    private Validator validator;
    private CreatePlantManagementRequestDTO requestDTO;
    private PlantCategory plantCategory;
    private Plants savedPlant;

    @BeforeEach
    void setUp() {

        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

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
        requestDTO.setSuitableLocation("kitchen");
        requestDTO.setCommonDiseases("rotten root");

        savedPlant = new Plants();
        savedPlant.setId(100L);
    }

    @Test
    void createPlantByManager_success() {
        try {
            when(plantCategoryRepository.findById(Long.valueOf(requestDTO.getCategoryId()))).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase(requestDTO.getScientificName())).thenReturn(false);
            when(plantRepository.existsByCommonNameIgnoreCase(requestDTO.getCommonName())).thenReturn(false);
            when(plantRepository.save(any(Plants.class))).thenReturn(savedPlant);

            Long result = plantManagementService.createPlantByManager(requestDTO, 123L);

            assertEquals(100L, result);
            verify(plantRepository).save(any(Plants.class));
            System.out.println("Test 'createPlantByManager_success' thành công");
            System.out.println("Plant ID: " + result);
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankScientificName() {
        try {
            requestDTO.setScientificName("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankScientificName' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("Exception: " + violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName());
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankScientificName' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankCommonName() {
        try {
            requestDTO.setCommonName("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankCommonName' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankCommonName' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankDescription() {
        try {
            requestDTO.setDescription("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankDescription' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankDescription' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankCareInstruction() {
        try {
            requestDTO.setCareInstructions("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankCareInstruction' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankCareInstruction' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankSuitableLocation() {
        try {
            requestDTO.setSuitableLocation("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankSuitableLocation' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankSuitableLocation' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_blankCommonDiseases() {
        try {
            requestDTO.setCommonDiseases("");

            Set<ConstraintViolation<CreatePlantManagementRequestDTO>> violations = validator.validate(requestDTO);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            System.out.println("Test 'createPlantByManager_blankCommonDiseases' thành công");
            for (ConstraintViolation<CreatePlantManagementRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_blankCommonDiseases' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_success_commonDiseases() {
        try {
            requestDTO.setCommonDiseases("");
            when(plantCategoryRepository.findById(Long.valueOf(requestDTO.getCategoryId()))).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase(requestDTO.getScientificName())).thenReturn(false);
            when(plantRepository.existsByCommonNameIgnoreCase(requestDTO.getCommonName())).thenReturn(false);
            when(plantRepository.save(any(Plants.class))).thenReturn(savedPlant);

            Long result = plantManagementService.createPlantByManager(requestDTO, 123L);

            assertEquals(100L, result);
            verify(plantRepository).save(any(Plants.class));
            System.out.println("Test 'createPlantByManager_success_careInstructionNull' thành công");
            System.out.println("Plant ID: " + result);
        } catch (Exception e) {
            System.out.println("Test 'createPlantByManager_success_careInstructionNull' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_categoryNotFound() {
        try {
            when(plantCategoryRepository.findById(Long.valueOf(requestDTO.getCategoryId()))).thenReturn(Optional.empty());

            ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_categoryNotFound' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            fail("Test 'createPlantByManager_categoryNotFound' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_scientificNameExists() {
        try {
            when(plantCategoryRepository.findById(Long.valueOf(requestDTO.getCategoryId()))).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase(requestDTO.getScientificName())).thenReturn(true);

            InvalidDataException ex = assertThrows(InvalidDataException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_scientificNameExists' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            fail("Test 'createPlantByManager_scientificNameExists' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPlantByManager_commonNameExists() {
        try {
            when(plantCategoryRepository.findById(Long.valueOf(requestDTO.getCategoryId()))).thenReturn(Optional.of(plantCategory));
            when(plantRepository.existsByScientificNameIgnoreCase(requestDTO.getScientificName())).thenReturn(false);
            when(plantRepository.existsByCommonNameIgnoreCase(requestDTO.getCommonName())).thenReturn(true);

            InvalidDataException ex = assertThrows(InvalidDataException.class, () ->
                    plantManagementService.createPlantByManager(requestDTO, 123L));

            verify(plantRepository, never()).save(any());
            System.out.println("Test 'createPlantByManager_commonNameExists' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            fail("Test 'createPlantByManager_commonNameExists' thất bại: " + e.getMessage());
        }
    }

}
