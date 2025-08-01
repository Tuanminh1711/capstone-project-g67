package com.plantcare_backend.service.plantManagementServiceTest;

import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantImageDetailDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GetPlantDetailTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantService;

    private Plants plant;
    private PlantCategory category;

    @BeforeEach
    void setUp() {
        category = new PlantCategory();
        category.setName("Indoor");

        plant = new Plants();
        plant.setId(1L);
        plant.setScientificName("Ficus lyrata");
        plant.setCommonName("Fiddle Leaf Fig");
        plant.setDescription("A popular indoor plant");
        plant.setCareInstructions("Water weekly");
        plant.setSuitableLocation("Living room");
        plant.setCommonDiseases("Root rot");
        plant.setStatus(Plants.PlantStatus.ACTIVE);
        plant.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(10)));
        plant.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));

        plant.setCategory(category);

        PlantImage image1 = new PlantImage(1L, plant, "url1.jpg", "Side image", true, Timestamp.valueOf(LocalDateTime.now()));
        PlantImage image2 = new PlantImage(2L, plant, "url2.jpg", "Side image", false, Timestamp.valueOf(LocalDateTime.now()));

        plant.setImages(Arrays.asList(image1, image2));
    }

    @Test
    void getPlantDetail_success() {
        try {
            when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));

            PlantDetailResponseDTO response = plantService.getPlantDetail(1L);

            assertNotNull(response);
            assertEquals(plant.getScientificName(), response.getScientificName(), "Scientific name should match");
            assertEquals(plant.getCommonName(), response.getCommonName(), "Common name should match");
            assertEquals(plant.getDescription(), response.getDescription(), "Description should match");
            assertEquals(plant.getCareInstructions(), response.getCareInstructions(), "Care instructions should match");
            assertEquals(plant.getSuitableLocation(), response.getSuitableLocation(), "Suitable location should match");
            assertEquals(plant.getCommonDiseases(), response.getCommonDiseases(), "Common diseases should match");
            assertEquals(plant.getStatus().name(), response.getStatus(), "Status should match");
            assertEquals("Indoor", response.getCategoryName(), "Category name should match");
            assertEquals(2, response.getImageUrls().size(), "Image URLs should match");
            assertEquals(2, response.getImages().size(), "Images should match");

            PlantImageDetailDTO firstImage = response.getImages().get(0);
            assertEquals("url1.jpg", firstImage.getImageUrl(), "Image URL should match");
            assertEquals("Side image", firstImage.getDescription(), "Image description should match");
            assertTrue(firstImage.getIsPrimary(), "Is primary should match");

            System.out.println("Test 'getPlantDetail_success' passed.");
        } catch (Exception e) {
            fail("Test 'createPlantByManager_scientificNameExists' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getPlantDetail_plantNotFound_shouldThrow() {
        when(plantRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> plantService.getPlantDetail(1L));

        assertEquals("Plant not found", exception.getMessage());
        System.out.println("Test 'getPlantDetail_plantNotFound_shouldThrow' passed.");
    }

    @Test
    void getPlantDetail_withNoImages_shouldReturnEmptyImageList() {
        plant.setImages(Collections.emptyList());
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));

        PlantDetailResponseDTO response = plantService.getPlantDetail(1L);

        assertNotNull(response);
        assertTrue(response.getImageUrls().isEmpty());
        assertTrue(response.getImages().isEmpty());

        System.out.println("Test 'getPlantDetail_withNoImages_shouldReturnEmptyImageList' passed.");
    }

    @Test
    void getPlantDetail_withNullCategory_shouldReturnNullCategoryName() {
        plant.setCategory(null);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));

        PlantDetailResponseDTO response = plantService.getPlantDetail(1L);

        assertNotNull(response);
        assertNull(response.getCategoryName());
        System.out.println("Test 'getPlantDetail_withNullCategory_shouldReturnNullCategoryName' passed.");
    }

    @Test
    void getPlantDetail_withNullStatus_shouldReturnNullStatus() {
        plant.setStatus(null);
        when(plantRepository.findById(1L)).thenReturn(Optional.of(plant));

        PlantDetailResponseDTO response = plantService.getPlantDetail(1L);

        assertNotNull(response);
        assertNull(response.getStatus());
        System.out.println("Test 'getPlantDetail_withNullStatus_shouldReturnNullStatus' passed.");
    }

}
