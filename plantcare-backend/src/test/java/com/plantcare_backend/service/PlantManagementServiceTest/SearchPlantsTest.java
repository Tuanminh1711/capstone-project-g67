package com.plantcare_backend.service.PlantManagementServiceTest;

import com.plantcare_backend.dto.request.plantsManager.PlantSearchRequestDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchPlantsTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private PlantSearchRequestDTO requestDTO;
    private Plants plant1;
    private Plants plant2;
    private Page<Plants> mockPage;

    Page<PlantListResponseDTO> result;

    @BeforeEach
    void setUp() {
        requestDTO = new PlantSearchRequestDTO();
        requestDTO.setKeyword("cactus");
        requestDTO.setCategoryId(1L);
        requestDTO.setLightRequirement("HIGH");
        requestDTO.setWaterRequirement("LOW");
        requestDTO.setCareDifficulty("EASY");
        requestDTO.setStatus("ACTIVE");
        requestDTO.setPage(0);
        requestDTO.setSize(10);

        plant1 = Plants.builder()
                .id(1L)
                .scientificName("Opuntia ficus-indica")
                .commonName("Prickly Pear")
                .careDifficulty(Plants.CareDifficulty.EASY)
                .lightRequirement(Plants.LightRequirement.HIGH)
                .waterRequirement(Plants.WaterRequirement.LOW)
                .status(Plants.PlantStatus.ACTIVE)
                .build();

        plant2 = Plants.builder()
                .id(2L)
                .scientificName("Echinopsis")
                .commonName("Easter Lily Cactus")
                .careDifficulty(Plants.CareDifficulty.EASY)
                .lightRequirement(Plants.LightRequirement.HIGH)
                .waterRequirement(Plants.WaterRequirement.LOW)
                .status(Plants.PlantStatus.ACTIVE)
                .build();

        mockPage = new PageImpl<>(List.of(plant1, plant2));
    }

    @Test
    void searchPlants_success() {
        try {
            when(plantRepository.searchPlants(
                    eq(requestDTO.getKeyword()),
                    eq(requestDTO.getCategoryId()),
                    eq(Plants.LightRequirement.HIGH),
                    eq(Plants.WaterRequirement.LOW),
                    eq(Plants.CareDifficulty.EASY),
                    eq(Plants.PlantStatus.ACTIVE),
                    any(PageRequest.class)
            )).thenReturn(mockPage);

            Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);

            assertNotNull(result);
            assertEquals(2, result.getTotalElements());

            List<PlantListResponseDTO> content = result.getContent();
            assertEquals("Prickly Pear", content.get(0).getCommonName());
            assertEquals("Easter Lily Cactus", content.get(1).getCommonName());

            System.out.println("Test 'searchPlants_success' thành công");
            for (PlantListResponseDTO plant : result.getContent()) {
                System.out.println(plant);
            }
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchPlants_filterReturnsOnePlant() {
        try {
            PlantSearchRequestDTO filterRequest = new PlantSearchRequestDTO();
            filterRequest.setKeyword("Prickly");
            filterRequest.setCategoryId(1L);
            filterRequest.setLightRequirement("HIGH");
            filterRequest.setWaterRequirement("LOW");
            filterRequest.setCareDifficulty("EASY");
            filterRequest.setStatus("ACTIVE");
            filterRequest.setPage(0);
            filterRequest.setSize(10);

            Page<Plants> filteredPage = new PageImpl<>(List.of(plant1));

            when(plantRepository.searchPlants(
                    eq("Prickly"),
                    eq(1L),
                    eq(Plants.LightRequirement.HIGH),
                    eq(Plants.WaterRequirement.LOW),
                    eq(Plants.CareDifficulty.EASY),
                    eq(Plants.PlantStatus.ACTIVE),
                    any(PageRequest.class)
            )).thenReturn(filteredPage);

            Page<PlantListResponseDTO> result = plantManagementService.searchPlants(filterRequest);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals("Prickly Pear", result.getContent().get(0).getCommonName());
            System.out.println("Test 'searchPlants_filterReturnsOnePlant' thành công");
            for (PlantListResponseDTO plant : result.getContent()) {
                System.out.println(plant);
            }
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_filterReturnsOnePlant' thất bại: " + e.getMessage());
        }
    }



    @Test
    void searchPlants_withNullEnums() {
        try {
            requestDTO.setLightRequirement(null);
            requestDTO.setWaterRequirement(null);
            requestDTO.setCareDifficulty(null);
            requestDTO.setStatus(null);

            when(plantRepository.searchPlants(
                    eq(requestDTO.getKeyword()),
                    eq(requestDTO.getCategoryId()),
                    isNull(),
                    isNull(),
                    isNull(),
                    isNull(),
                    any(PageRequest.class)
            )).thenReturn(mockPage);

            Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);
            assertNotNull(result);
            assertEquals(2, result.getContent().size());

            for (PlantListResponseDTO plant : result.getContent()) {
                System.out.println(plant);
            }
            System.out.println("Test 'searchPlants_withNullEnums' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_withNullEnums' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchPlants_emptyResult() {
        try {
            Page<Plants> emptyPage = new PageImpl<>(List.of());
            when(plantRepository.searchPlants(
                    any(), any(), any(), any(), any(), any(), any()
            )).thenReturn(emptyPage);

            Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);

            assertNotNull(result);
            assertEquals(0, result.getTotalElements());

            System.out.println("Test 'searchPlants_emptyResult' thành công");
            for (PlantListResponseDTO plant : result.getContent()) {
                System.out.println(plant);
            }
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_emptyResult' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchPlants_invalidPageIndex() {
        try {
            requestDTO.setPage(-1);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                plantManagementService.searchPlants(requestDTO);
            });

            System.out.println("Test 'searchPlants_invalidPageIndex' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_invalidPageIndex' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchPlants_invalidEnumValue() {
        try {
            requestDTO.setLightRequirement("INVALID_ENUM");

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                plantManagementService.searchPlants(requestDTO);
            });

            System.out.println("Test 'searchPlants_invalidEnumValue' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_invalidEnumValue' thất bại: " + e.getMessage());
        }
    }
}
