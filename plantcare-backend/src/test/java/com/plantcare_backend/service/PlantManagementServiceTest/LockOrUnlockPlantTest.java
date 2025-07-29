package com.plantcare_backend.service.PlantManagementServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Plants;
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
class LockOrUnlockPlantTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantService;

    private Plants plant;

    @BeforeEach
    void setUp() {
        plant = new Plants();
        plant.setId(1L);
        plant.setStatus(Plants.PlantStatus.ACTIVE);
    }

    @Test
    void lockOrUnlockPlant_shouldLockPlantSuccessfully() {
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Plants.PlantStatus result = plantService.lockOrUnlockPlant(1L, true);

        assertEquals(Plants.PlantStatus.INACTIVE, result);
        verify(plantRepository).save(plant);
        System.out.println("✅ Test 'lockOrUnlockPlant_shouldLockPlantSuccessfully' passed.");
    }

    @Test
    void lockOrUnlockPlant_shouldUnlockPlantSuccessfully() {
        plant.setStatus(Plants.PlantStatus.INACTIVE);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Plants.PlantStatus result = plantService.lockOrUnlockPlant(1L, false);

        assertEquals(Plants.PlantStatus.ACTIVE, result);
        verify(plantRepository).save(plant);
        System.out.println("✅ Test 'lockOrUnlockPlant_shouldUnlockPlantSuccessfully' passed.");
    }

    @Test
    void lockOrUnlockPlant_shouldThrowExceptionWhenPlantNotFound() {
        when(plantRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () ->
                plantService.lockOrUnlockPlant(1L, true));

        assertEquals("Plant not found", exception.getMessage());
        verify(plantRepository, never()).save(any());
        System.out.println("✅ Test 'lockOrUnlockPlant_shouldThrowExceptionWhenPlantNotFound' passed.");
    }

    @Test
    void lockOrUnlockPlant_shouldNotChangeIfAlreadyLocked() {
        plant.setStatus(Plants.PlantStatus.INACTIVE);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Plants.PlantStatus result = plantService.lockOrUnlockPlant(1L, true);

        assertEquals(Plants.PlantStatus.INACTIVE, result);
        verify(plantRepository).save(plant);
        System.out.println("✅ Test 'lockOrUnlockPlant_shouldNotChangeIfAlreadyLocked' passed.");
    }

    @Test
    void lockOrUnlockPlant_shouldNotChangeIfAlreadyUnlocked() {
        plant.setStatus(Plants.PlantStatus.ACTIVE);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Plants.PlantStatus result = plantService.lockOrUnlockPlant(1L, false);

        assertEquals(Plants.PlantStatus.ACTIVE, result);
        verify(plantRepository).save(plant);
        System.out.println("✅ Test 'lockOrUnlockPlant_shouldNotChangeIfAlreadyUnlocked' passed.");
    }

}
