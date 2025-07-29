package com.plantcare_backend.service.UserPlantsServiceTest;

import com.plantcare_backend.dto.response.userPlants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantImageDetailDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserPlantImage;
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
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetUserPlantDetailTest {

    @Mock
    private UserPlantRepository userPlantRepository;

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private Long userPlantId;
    private UserPlants entity;

    @BeforeEach
    void setUp() {
        userPlantId = 1001L;

        entity = new UserPlants();
        entity.setUserPlantId(userPlantId);
        entity.setPlantId(555L);
        entity.setPlantName("My Pothos");
        entity.setPlantDate(Timestamp.from(Instant.now().minusSeconds(86_400)));
        entity.setPlantLocation("Window");
        // images sẽ set riêng theo từng test
    }

    @Test
    void getUserPlantDetail_shouldMapAllFields_withImages() {
        // given images
        UserPlantImage img1 = new UserPlantImage();
        img1.setId(11L);
        img1.setImageUrl("https://cdn/img1.jpg");
        img1.setDescription("First");

        UserPlantImage img2 = new UserPlantImage();
        img2.setId(12L);
        img2.setImageUrl("https://cdn/img2.jpg");
        img2.setDescription("Second");

        entity.setImages(Arrays.asList(img1, img2));

        when(userPlantRepository.findById(userPlantId)).thenReturn(Optional.of(entity));

        // when
        UserPlantDetailResponseDTO dto = userPlantsService.getUserPlantDetail(userPlantId);

        // then
        assertNotNull(dto);
        assertEquals(entity.getUserPlantId(), dto.getUserPlantId());
        assertEquals(entity.getPlantId(), dto.getPlantId());
        assertEquals(entity.getPlantName(), dto.getNickname());
        assertEquals(entity.getPlantDate(), dto.getPlantingDate());
        assertEquals(entity.getPlantLocation(), dto.getLocationInHouse());

        // images
        assertNotNull(dto.getImageUrls());
        assertNotNull(dto.getImages());
        assertEquals(2, dto.getImageUrls().size());
        assertEquals(2, dto.getImages().size());

        // check mapping từng phần tử
        assertEquals("https://cdn/img1.jpg", dto.getImageUrls().get(0));
        assertEquals("https://cdn/img2.jpg", dto.getImageUrls().get(1));

        UserPlantImageDetailDTO d1 = dto.getImages().get(0);
        assertEquals(11L, d1.getId());
        assertEquals("https://cdn/img1.jpg", d1.getImageUrl());
        assertEquals("First", d1.getDescription());

        UserPlantImageDetailDTO d2 = dto.getImages().get(1);
        assertEquals(12L, d2.getId());
        assertEquals("https://cdn/img2.jpg", d2.getImageUrl());
        assertEquals("Second", d2.getDescription());

        verify(userPlantRepository, times(1)).findById(userPlantId);
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ getUserPlantDetail_shouldMapAllFields_withImages: PASSED");
    }

    @Test
    void getUserPlantDetail_shouldReturnEmptyLists_whenImagesNull() {
        // given: entity không có images (null)
        entity.setImages(null);
        when(userPlantRepository.findById(userPlantId)).thenReturn(Optional.of(entity));

        // when
        UserPlantDetailResponseDTO dto = userPlantsService.getUserPlantDetail(userPlantId);

        // then
        assertNotNull(dto);
        assertEquals(entity.getUserPlantId(), dto.getUserPlantId());
        assertEquals(entity.getPlantId(), dto.getPlantId());
        assertEquals(entity.getPlantName(), dto.getNickname());
        assertEquals(entity.getPlantDate(), dto.getPlantingDate());
        assertEquals(entity.getPlantLocation(), dto.getLocationInHouse());

        // service tạo list mới -> không null và rỗng
        assertNotNull(dto.getImageUrls());
        assertTrue(dto.getImageUrls().isEmpty());
        assertNotNull(dto.getImages());
        assertTrue(dto.getImages().isEmpty());

        verify(userPlantRepository, times(1)).findById(userPlantId);
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ getUserPlantDetail_shouldReturnEmptyLists_whenImagesNull: PASSED");
    }

    @Test
    void getUserPlantDetail_shouldReturnEmptyLists_whenImagesEmpty() {
        // given: images là empty list
        entity.setImages(Collections.emptyList());
        when(userPlantRepository.findById(userPlantId)).thenReturn(Optional.of(entity));

        // when
        UserPlantDetailResponseDTO dto = userPlantsService.getUserPlantDetail(userPlantId);

        // then
        assertNotNull(dto);
        assertEquals(entity.getUserPlantId(), dto.getUserPlantId());
        assertEquals(entity.getPlantId(), dto.getPlantId());
        assertEquals(entity.getPlantName(), dto.getNickname());
        assertEquals(entity.getPlantDate(), dto.getPlantingDate());
        assertEquals(entity.getPlantLocation(), dto.getLocationInHouse());

        assertNotNull(dto.getImageUrls());
        assertTrue(dto.getImageUrls().isEmpty());
        assertNotNull(dto.getImages());
        assertTrue(dto.getImages().isEmpty());

        verify(userPlantRepository, times(1)).findById(userPlantId);
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ getUserPlantDetail_shouldReturnEmptyLists_whenImagesEmpty: PASSED");
    }

    @Test
    void getUserPlantDetail_shouldThrow_whenNotFound() {
        // given
        when(userPlantRepository.findById(userPlantId)).thenReturn(Optional.empty());

        // when + then
        assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.getUserPlantDetail(userPlantId));

        verify(userPlantRepository, times(1)).findById(userPlantId);
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ getUserPlantDetail_shouldThrow_whenNotFound: PASSED");
    }

    @Test
    void getUserPlantDetail_shouldThrow_whenUserPlantIdNull() {
        // Stub repo ném IllegalArgumentException khi id = null (giống Spring Data)
        when(userPlantRepository.findById(isNull()))
                .thenThrow(new IllegalArgumentException("The given id must not be null!"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.getUserPlantDetail(null));
        assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));

        verify(userPlantRepository, times(1)).findById(isNull());
        verifyNoMoreInteractions(userPlantRepository);

        System.out.println("✅ getUserPlantDetail_shouldThrow_whenUserPlantIdNull: PASSED");
    }

}
