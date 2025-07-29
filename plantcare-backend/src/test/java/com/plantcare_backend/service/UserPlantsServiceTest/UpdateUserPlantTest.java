package com.plantcare_backend.service.UserPlantsServiceTest;

import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateUserPlantTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private Long userId;
    private Long userPlantId;

    private UserPlants existing;
    private UpdateUserPlantRequestDTO req;

    @BeforeEach
    void setUp() {
        userId = 42L;
        userPlantId = 101L;

        existing = new UserPlants();
        // nếu lớp có setter tương ứng, gán để kiểm tra update
        existing.setUserPlantId(userPlantId);
        existing.setUserId(userId);
        existing.setPlantName("Old Name");
        existing.setPlantDate(Timestamp.from(Instant.now().minusSeconds(86_400)));
        existing.setPlantLocation("Old Location");

        req = new UpdateUserPlantRequestDTO();
        req.setUserPlantId(userPlantId);
        req.setNickname("New Nickname");
        req.setPlantingDate(Timestamp.from(Instant.now()));
        req.setLocationInHouse("New Location");
        req.setReminderEnabled(true);
    }

    @Test
    void updateUserPlant_shouldUpdateFieldsAndSave_whenFound() {
        // given
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.of(existing));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // when
        userPlantsService.updateUserPlant(req, userId);

        // then
        ArgumentCaptor<UserPlants> captor = ArgumentCaptor.forClass(UserPlants.class);
        verify(userPlantRepository, times(1))
                .findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, times(1))
                .save(captor.capture());

        UserPlants saved = captor.getValue();
        assertSame(existing, saved); // service chỉnh trực tiếp trên entity tìm được
        assertEquals("New Nickname", saved.getPlantName());
        assertEquals(req.getPlantingDate(), saved.getPlantDate());
        assertEquals("New Location", saved.getPlantLocation());

        System.out.println("✅ updateUserPlant_shouldUpdateFieldsAndSave_whenFound: PASSED");
    }

    @Test
    void updateUserPlant_shouldThrow_whenNotFound() {
        // given
        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.empty());

        // when + then
        assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.updateUserPlant(req, userId));

        verify(userPlantRepository, times(1))
                .findByUserPlantIdAndUserId(userPlantId, userId);
        verify(userPlantRepository, never()).save(any());

        System.out.println("✅ updateUserPlant_shouldThrow_whenNotFound: PASSED");
    }

    @Test
    void updateUserPlant_shouldAllowNullFields_andSave() {
        // given: cho phép null (service hiện tại không validate)
        req.setNickname(null);
        req.setLocationInHouse(null);
        req.setPlantingDate(null);

        when(userPlantRepository.findByUserPlantIdAndUserId(userPlantId, userId))
                .thenReturn(Optional.of(existing));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // when
        userPlantsService.updateUserPlant(req, userId);

        // then
        ArgumentCaptor<UserPlants> captor = ArgumentCaptor.forClass(UserPlants.class);
        verify(userPlantRepository).save(captor.capture());
        UserPlants saved = captor.getValue();

        assertNull(saved.getPlantName());       // nickname null -> plantName null
        assertNull(saved.getPlantDate());       // plantingDate null
        assertNull(saved.getPlantLocation());   // location null

        System.out.println("✅ updateUserPlant_shouldAllowNullFields_andSave: PASSED");
    }

    @Test
    void updateUserPlant_shouldCallRepoWithExactArguments() {
        // given
        when(userPlantRepository.findByUserPlantIdAndUserId(eq(userPlantId), eq(userId)))
                .thenReturn(Optional.of(existing));
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // when
        userPlantsService.updateUserPlant(req, userId);

        // then
        verify(userPlantRepository, times(1))
                .findByUserPlantIdAndUserId(eq(userPlantId), eq(userId));
        verify(userPlantRepository, times(1)).save(same(existing));
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ updateUserPlant_shouldCallRepoWithExactArguments: PASSED");
    }


    @Test
    void updateUserPlant_shouldThrow_whenNicknameNull() {
        // given
        req.setNickname(null);

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.updateUserPlant(req, userId));
        assertEquals("Nickname must not be null", ex.getMessage());

        // Không được gọi repo khi validate fail sớm
        verify(userPlantRepository, never()).findByUserPlantIdAndUserId(anyLong(), anyLong());
        verify(userPlantRepository, never()).save(any());

        System.out.println("✅ updateUserPlant_shouldThrow_whenNicknameNull: PASSED");
    }

    @Test
    void updateUserPlant_shouldThrow_whenLocationNull() {
        // given
        req.setLocationInHouse(null);

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.updateUserPlant(req, userId));
        assertEquals("Location must not be null", ex.getMessage());

        // Không được gọi repo khi validate fail sớm
        verify(userPlantRepository, never()).findByUserPlantIdAndUserId(anyLong(), anyLong());
        verify(userPlantRepository, never()).save(any());

        System.out.println("✅ updateUserPlant_shouldThrow_whenLocationNull: PASSED");
    }
}
