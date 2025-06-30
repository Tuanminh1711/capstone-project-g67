package com.plantcare_backend.service;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPlantsServiceTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private UserPlants testUserPlant;

    @BeforeEach
    void setUp() {
        testUserPlant = UserPlants.builder()
                .userPlantId(1L)
                .userId(1L)
                .plantId(1L)
                .plantName("Test Plant")
                .plantDate(new Timestamp(System.currentTimeMillis()))
                .plantLocation("Living Room")
                .reminder_enabled(true)
                .created_at(new Timestamp(System.currentTimeMillis()))
                .build();
    }

    @Test
    void deleteUserPlant_Success() {
        // Arrange
        Long userPlantId = 1L;
        Long userId = 1L;
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.of(testUserPlant));
        doNothing().when(userPlantRepository).delete(any(UserPlants.class));

        // Act
        assertDoesNotThrow(() -> userPlantsService.deleteUserPlant(userPlantId, userId));

        // Assert
        verify(userPlantRepository, times(1)).findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, times(1)).delete(testUserPlant);
    }

    @Test
    void deleteUserPlant_NotFound() {
        // Arrange
        Long userPlantId = 1L;
        Long userId = 1L;
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.deleteUserPlant(userPlantId, userId));
        
        assertEquals("User plant not found or you don't have permission to delete it", exception.getMessage());
        verify(userPlantRepository, times(1)).findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, never()).delete(any(UserPlants.class));
    }

    @Test
    void deleteUserPlant_WrongUser() {
        // Arrange
        Long userPlantId = 1L;
        Long userId = 2L; // Different user ID
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.deleteUserPlant(userPlantId, userId));
        
        assertEquals("User plant not found or you don't have permission to delete it", exception.getMessage());
        verify(userPlantRepository, times(1)).findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, never()).delete(any(UserPlants.class));
    }
} 