package com.plantcare_backend.service.userPlantsServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteUserPlantTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private Long userPlantId;
    private Long userId;
    private UserPlants userPlant;

    @BeforeEach
    void setUp() {
        userPlantId = 101L;
        userId = 42L;

        userPlant = new UserPlants();
        // Nếu cần tránh NPE ở nơi khác, có thể set thêm các field:
        // userPlant.setUserPlantId(userPlantId);
        // userPlant.setUserId(userId);
    }

    @Test
    void deleteUserPlant_shouldDelete_whenFound() {
        // given
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.of(userPlant));

        ArgumentCaptor<UserPlants> captor = ArgumentCaptor.forClass(UserPlants.class);

        // when
        userPlantsService.deleteUserPlant(userPlantId, userId);

        // then
        verify(userPlantRepository, times(1))
                .findByUserPlantIdAndUserId(userPlantId, userId);

        verify(userPlantRepository, times(1))
                .delete(captor.capture());

        UserPlants deleted = captor.getValue();
        assertNotNull(deleted);
        assertEquals(userPlant, deleted);

        System.out.println("✅ deleteUserPlant_shouldDelete_whenFound: PASSED");
    }

    @Test
    void deleteUserPlant_shouldThrow_whenNotFound() {
        // given
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.empty());

        // when + then
        assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.deleteUserPlant(userPlantId, userId));

        // Không được gọi delete khi không tìm thấy
        verify(userPlantRepository, times(1))
                .findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, never()).delete(any(UserPlants.class));

        System.out.println("✅ deleteUserPlant_shouldThrow_whenNotFound: PASSED");
    }

}
