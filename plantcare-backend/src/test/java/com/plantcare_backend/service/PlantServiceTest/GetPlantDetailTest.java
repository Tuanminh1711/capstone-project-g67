package com.plantcare_backend.service.PlantServiceTest;

import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class GetPlantDetailTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantServiceImpl plantService;

    // Test 1: Plant does not exist -> throw ResourceNotFoundException
    @Test
    void testGetPlantDetail_WhenPlantDoesNotExist_ShouldThrowException() {
        // Arrange
        Long plantId = 1L;
        when(plantRepository.findById(plantId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> plantService.getPlantDetail(plantId)
        );

        assertEquals("Plant not found", exception.getMessage());
    }

    // Test 2: Plant exists with images
    @Test
    void testGetPlantDetail_WhenPlantExistsWithImages_ShouldReturnDTOWithImages() {
        // Arrange
        Long plantId = 1L;
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());

        // Create mock plant category
        PlantCategory category = PlantCategory.builder()
                .id(1L)
                .name("Indoor Plants")
                .description("Indoor plant category")
                .build();

        // Create mock plant images
        PlantImage image1 = PlantImage.builder()
                .id(1L)
                .imageUrl("https://example.com/image1.jpg")
                .description("First plant image")
                .isPrimary(true)
                .build();

        PlantImage image2 = PlantImage.builder()
                .id(2L)
                .imageUrl("https://example.com/image2.jpg")
                .description("Second plant image")
                .isPrimary(false)
                .build();

        // Create mock plant
        Plants mockPlant = Plants.builder()
                .id(plantId)
                .scientificName("Ficus lyrata")
                .commonName("Fiddle Leaf Fig")
                .description("A popular indoor plant with large, violin-shaped leaves")
                .careInstructions("Water weekly, keep in bright indirect light")
                .suitableLocation("Indoor, living room")
                .commonDiseases("Root rot, leaf spot")
                .status(Plants.PlantStatus.ACTIVE)
                .lightRequirement(Plants.LightRequirement.MEDIUM)
                .waterRequirement(Plants.WaterRequirement.MEDIUM)
                .category(category)
                .createdAt(now)
                .updatedAt(now)
                .images(Arrays.asList(image1, image2))
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));

        // Act
        PlantDetailResponseDTO response = plantService.getPlantDetail(plantId);

        // Assert
        assertNotNull(response);
        assertEquals(plantId, response.getId());
        assertEquals("Ficus lyrata", response.getScientificName());
        assertEquals("Fiddle Leaf Fig", response.getCommonName());
        assertEquals("A popular indoor plant with large, violin-shaped leaves", response.getDescription());
        assertEquals("Water weekly, keep in bright indirect light", response.getCareInstructions());
        assertEquals("Indoor, living room", response.getSuitableLocation());
        assertEquals("Root rot, leaf spot", response.getCommonDiseases());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(Plants.LightRequirement.MEDIUM, response.getLightRequirement());
        assertEquals(Plants.WaterRequirement.MEDIUM, response.getWaterRequirement());
        assertEquals("Đang hoạt động", response.getStatusDisplay());
        assertEquals(now, response.getCreatedAt());
        assertEquals(now, response.getUpdatedAt());
        assertEquals("Indoor Plants", response.getCategoryName());
        
        // Assert images
        assertNotNull(response.getImageUrls());
        assertEquals(2, response.getImageUrls().size());
        assertTrue(response.getImageUrls().contains("https://example.com/image1.jpg"));
        assertTrue(response.getImageUrls().contains("https://example.com/image2.jpg"));
    }

    // Test 3: Plant exists without images
    @Test
    void testGetPlantDetail_WhenPlantExistsWithoutImages_ShouldReturnDTOWithEmptyImageList() {
        // Arrange
        Long plantId = 1L;
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());

        // Create mock plant category
        PlantCategory category = PlantCategory.builder()
                .id(2L)
                .name("Outdoor Plants")
                .description("Outdoor plant category")
                .build();

        // Create mock plant without images
        Plants mockPlant = Plants.builder()
                .id(plantId)
                .scientificName("Rosa chinensis")
                .commonName("China Rose")
                .description("A beautiful outdoor rose plant")
                .careInstructions("Plant in well-draining soil, full sun")
                .suitableLocation("Outdoor garden")
                .commonDiseases("Black spot, powdery mildew")
                .status(Plants.PlantStatus.ACTIVE)
                .lightRequirement(Plants.LightRequirement.HIGH)
                .waterRequirement(Plants.WaterRequirement.MEDIUM)
                .category(category)
                .createdAt(now)
                .updatedAt(now)
                .images(null) // No images
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));

        // Act
        PlantDetailResponseDTO response = plantService.getPlantDetail(plantId);

        // Assert
        assertNotNull(response);
        assertEquals(plantId, response.getId());
        assertEquals("Rosa chinensis", response.getScientificName());
        assertEquals("China Rose", response.getCommonName());
        assertEquals("A beautiful outdoor rose plant", response.getDescription());
        assertEquals("Plant in well-draining soil, full sun", response.getCareInstructions());
        assertEquals("Outdoor garden", response.getSuitableLocation());
        assertEquals("Black spot, powdery mildew", response.getCommonDiseases());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(Plants.LightRequirement.HIGH, response.getLightRequirement());
        assertEquals(Plants.WaterRequirement.MEDIUM, response.getWaterRequirement());
        assertEquals("Đang hoạt động", response.getStatusDisplay());
        assertEquals(now, response.getCreatedAt());
        assertEquals(now, response.getUpdatedAt());
        assertEquals("Outdoor Plants", response.getCategoryName());
        
        // Assert empty image list
        assertNotNull(response.getImageUrls());
        assertTrue(response.getImageUrls().isEmpty());
    }

    // Test 4: Plant exists with null category
    @Test
    void testGetPlantDetail_WhenPlantExistsWithNullCategory_ShouldReturnDTOWithNullCategoryName() {
        // Arrange
        Long plantId = 1L;
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());

        // Create mock plant with null category
        Plants mockPlant = Plants.builder()
                .id(plantId)
                .scientificName("Aloe vera")
                .commonName("Aloe Vera")
                .description("A succulent plant species")
                .careInstructions("Minimal water, bright light")
                .suitableLocation("Indoor, windowsill")
                .commonDiseases("Root rot from overwatering")
                .status(Plants.PlantStatus.ACTIVE)
                .lightRequirement(Plants.LightRequirement.MEDIUM)
                .waterRequirement(Plants.WaterRequirement.LOW)
                .category(null) // Null category
                .createdAt(now)
                .updatedAt(now)
                .images(new ArrayList<>()) // Empty image list
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));

        // Act
        PlantDetailResponseDTO response = plantService.getPlantDetail(plantId);

        // Assert
        assertNotNull(response);
        assertEquals(plantId, response.getId());
        assertEquals("Aloe vera", response.getScientificName());
        assertEquals("Aloe Vera", response.getCommonName());
        assertEquals("A succulent plant species", response.getDescription());
        assertEquals("Minimal water, bright light", response.getCareInstructions());
        assertEquals("Indoor, windowsill", response.getSuitableLocation());
        assertEquals("Root rot from overwatering", response.getCommonDiseases());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(Plants.LightRequirement.MEDIUM, response.getLightRequirement());
        assertEquals(Plants.WaterRequirement.LOW, response.getWaterRequirement());
        assertEquals("Đang hoạt động", response.getStatusDisplay());
        assertEquals(now, response.getCreatedAt());
        assertEquals(now, response.getUpdatedAt());
        assertNull(response.getCategoryName()); // Category name should be null
        
        // Assert empty image list
        assertNotNull(response.getImageUrls());
        assertTrue(response.getImageUrls().isEmpty());
    }
}
