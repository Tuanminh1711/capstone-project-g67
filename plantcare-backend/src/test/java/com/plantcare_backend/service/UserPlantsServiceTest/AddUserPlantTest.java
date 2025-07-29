package com.plantcare_backend.service.UserPlantsServiceTest;

import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddUserPlantTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private AddUserPlantRequestDTO req;
    private Long userId;

    @BeforeEach
    void setUp() {
        userId = 88L;
        req = new AddUserPlantRequestDTO();
        req.setPlantId(123L);
        req.setNickname("My Pothos");
        req.setPlantingDate(new Timestamp(System.currentTimeMillis() - 1000));
        req.setLocationInHouse("Window");
        req.setReminderEnabled(true);
    }

    @Test
    void addUserPlant_success_withFullRequestAndImages() throws Exception {
        // stub chỉ trong test dùng -> tránh UnnecessaryStubbingException
        when(userPlantRepository.save(any(UserPlants.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // given images
        MultipartFile f1 = mock(MultipartFile.class);
        MultipartFile f2 = mock(MultipartFile.class);
        when(f1.isEmpty()).thenReturn(false);
        when(f2.isEmpty()).thenReturn(false);
        List<MultipartFile> images = Arrays.asList(f1, f2);

        // when
        assertDoesNotThrow(() -> userPlantsService.addUserPlant(req, images, userId));

        // then: save được gọi 2 lần & mapping đúng
        ArgumentCaptor<UserPlants> captor = ArgumentCaptor.forClass(UserPlants.class);
        verify(userPlantRepository, times(2)).save(captor.capture());
        UserPlants firstSaved = captor.getAllValues().get(0);

        assertEquals(userId, firstSaved.getUserId());
        assertEquals(req.getPlantId(), firstSaved.getPlantId());
        assertEquals(req.getNickname(), firstSaved.getPlantName());
        assertEquals(req.getPlantingDate(), firstSaved.getPlantDate());
        assertEquals(req.getLocationInHouse(), firstSaved.getPlantLocation());
        assertNotNull(firstSaved.getCreated_at());

        System.out.println("✅ addUserPlant_success_withFullRequestAndImages: PASSED");
    }

    @Test
    void addUserPlant_fail_whenUserIdNull() {
        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.addUserPlant(req, Collections.emptyList(), null));
        assertEquals("UserId must not be null", ex.getMessage());

        verify(userPlantRepository, never()).save(any());
        System.out.println("✅ addUserPlant_fail_whenUserIdNull: PASSED");
    }

    @Test
    void addUserPlant_fail_whenPlantIdNull() {
        // given
        req.setPlantId(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.addUserPlant(req, Collections.emptyList(), userId));
        assertEquals("PlantId must not be null", ex.getMessage());

        verify(userPlantRepository, never()).save(any());
        System.out.println("✅ addUserPlant_fail_whenPlantIdNull: PASSED");
    }

    @Test
    void addUserPlant_fail_whenNicknameBlank() {
        // given
        req.setNickname("   ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.addUserPlant(req, Collections.emptyList(), userId));
        assertEquals("Nickname must not be blank", ex.getMessage());

        verify(userPlantRepository, never()).save(any());
        System.out.println("✅ addUserPlant_fail_whenNicknameBlank: PASSED");
    }

    @Test
    void addUserPlant_fail_whenLocationBlank() {
        // given
        req.setLocationInHouse("   ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.addUserPlant(req, Collections.emptyList(), userId));
        assertEquals("Location must not be blank", ex.getMessage());

        verify(userPlantRepository, never()).save(any());
        System.out.println("✅ addUserPlant_fail_whenLocationBlank: PASSED");
    }
}
