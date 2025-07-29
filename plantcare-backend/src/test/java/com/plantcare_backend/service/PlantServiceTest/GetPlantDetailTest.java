package com.plantcare_backend.service.PlantServiceTest;

import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class GetPlantDetailTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantServiceImpl plantService;

    private Plants plantFull;
    private Plants plantNoCategoryNoImages;

    @BeforeEach
    void setUp() {
        // --- Plant đầy đủ thông tin ---
        PlantCategory category = new PlantCategory();
        category.setId(10L);
        category.setName("Indoor");

        PlantImage img1 = new PlantImage();
        img1.setImageUrl("http://img/1.jpg");
        PlantImage img2 = new PlantImage();
        img2.setImageUrl("http://img/2.jpg");

        plantFull = new Plants();
        plantFull.setId(1L);
        plantFull.setScientificName("Ficus lyrata");
        plantFull.setCommonName("Fiddle Leaf Fig");
        plantFull.setDescription("Popular indoor plant");
        plantFull.setCareInstructions("Bright indirect light, moderate watering");
        plantFull.setSuitableLocation("Living room");
        plantFull.setCommonDiseases("Root rot");
        plantFull.setStatus(Plants.PlantStatus.ACTIVE);
        plantFull.setLightRequirement(Plants.LightRequirement.MEDIUM);
        plantFull.setWaterRequirement(Plants.WaterRequirement.HIGH);
        plantFull.setCreatedAt(new Timestamp(System.currentTimeMillis() - 10000));
        plantFull.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        plantFull.setCategory(category);
        plantFull.setImages(List.of(img1, img2));

        // --- Plant thiếu category & images ---
        plantNoCategoryNoImages = new Plants();
        plantNoCategoryNoImages.setId(2L);
        plantNoCategoryNoImages.setScientificName("Sansevieria trifasciata");
        plantNoCategoryNoImages.setCommonName("Snake Plant");
        plantNoCategoryNoImages.setDescription("Very hardy plant");
        plantNoCategoryNoImages.setCareInstructions("Low light tolerant, infrequent watering");
        plantNoCategoryNoImages.setSuitableLocation("Bedroom");
        plantNoCategoryNoImages.setCommonDiseases("Overwatering issues");
        plantNoCategoryNoImages.setStatus(Plants.PlantStatus.INACTIVE);
        plantNoCategoryNoImages.setLightRequirement(Plants.LightRequirement.LOW);
        plantNoCategoryNoImages.setWaterRequirement(Plants.WaterRequirement.LOW);
        plantNoCategoryNoImages.setCreatedAt(new Timestamp(System.currentTimeMillis() - 20000));
        plantNoCategoryNoImages.setUpdatedAt(new Timestamp(System.currentTimeMillis() - 5000));
        plantNoCategoryNoImages.setCategory(null);
        plantNoCategoryNoImages.setImages(null);
    }

    @Test
    void getPlantDetail_success_fullData() {
        try {
            given(plantRepository.findById(1L)).willReturn(Optional.of(plantFull));

            PlantDetailResponseDTO dto = plantService.getPlantDetail(1L);

            assertNotNull(dto);
            assertEquals(plantFull.getId(), dto.getId());
            assertEquals(plantFull.getScientificName(), dto.getScientificName());
            assertEquals(plantFull.getCommonName(), dto.getCommonName());
            assertEquals(plantFull.getDescription(), dto.getDescription());
            assertEquals(plantFull.getCareInstructions(), dto.getCareInstructions());
            assertEquals(plantFull.getSuitableLocation(), dto.getSuitableLocation());
            assertEquals(plantFull.getCommonDiseases(), dto.getCommonDiseases());
            assertEquals(plantFull.getStatus().name(), dto.getStatus());
            assertEquals(plantFull.getLightRequirement(), dto.getLightRequirement());
            assertEquals(plantFull.getWaterRequirement(), dto.getWaterRequirement());
            assertNotNull(dto.getStatusDisplay()); // không assert exact text vì phụ thuộc getStatusDisplay()
            assertEquals(plantFull.getCreatedAt(), dto.getCreatedAt());
            assertEquals(plantFull.getUpdatedAt(), dto.getUpdatedAt());
            assertEquals("Indoor", dto.getCategoryName());
            assertNotNull(dto.getImageUrls());
            assertEquals(2, dto.getImageUrls().size());
            assertTrue(dto.getImageUrls().contains("http://img/1.jpg"));
            assertTrue(dto.getImageUrls().contains("http://img/2.jpg"));

            verify(plantRepository).findById(1L);

            System.out.println("Test 'getPlantDetail_success_fullData' thành công");
            System.out.println("Response: " + dto);
        } catch (Exception e) {
            System.out.println("Test 'getPlantDetail_success_fullData' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void getPlantDetail_success_nullCategoryAndImages() {
        try {
            given(plantRepository.findById(2L)).willReturn(Optional.of(plantNoCategoryNoImages));

            PlantDetailResponseDTO dto = plantService.getPlantDetail(2L);

            assertNotNull(dto);
            assertEquals(plantNoCategoryNoImages.getId(), dto.getId());
            assertEquals(plantNoCategoryNoImages.getScientificName(), dto.getScientificName());
            assertEquals(plantNoCategoryNoImages.getCommonName(), dto.getCommonName());
            assertEquals(plantNoCategoryNoImages.getDescription(), dto.getDescription());
            assertEquals(plantNoCategoryNoImages.getCareInstructions(), dto.getCareInstructions());
            assertEquals(plantNoCategoryNoImages.getSuitableLocation(), dto.getSuitableLocation());
            assertEquals(plantNoCategoryNoImages.getCommonDiseases(), dto.getCommonDiseases());
            assertEquals(plantNoCategoryNoImages.getStatus().name(), dto.getStatus());
            assertEquals(plantNoCategoryNoImages.getLightRequirement(), dto.getLightRequirement());
            assertEquals(plantNoCategoryNoImages.getWaterRequirement(), dto.getWaterRequirement());
            assertNull(dto.getCategoryName()); // category null
            assertNotNull(dto.getImageUrls());
            assertTrue(dto.getImageUrls().isEmpty()); // images null -> list rỗng

            System.out.println("Test 'getPlantDetail_success_nullCategoryAndImages' thành công");
            System.out.println("Response: " + dto);
        } catch (Exception e) {
            System.out.println("Test 'getPlantDetail_success_nullCategoryAndImages' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void getPlantDetail_notFound_shouldThrow() {
        try {
            given(plantRepository.findById(999L)).willReturn(Optional.empty());

            ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                    () -> plantService.getPlantDetail(999L));

            assertEquals("Plant not found", ex.getMessage());
            System.out.println("Test 'getPlantDetail_notFound_shouldThrow' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'getPlantDetail_notFound_shouldThrow' thất bại: " + e.getMessage());
            fail(e);
        }
    }

}
