package com.plantcare_backend.service.PlantServiceTest;

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
import org.springframework.data.domain.*;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchPlantsTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private PlantSearchRequestDTO searchRequest;

    @BeforeEach
    void setUp() {
        searchRequest = new PlantSearchRequestDTO();
        searchRequest.setKeyword("fern");
        searchRequest.setCategoryId(null);
        searchRequest.setLightRequirement(null);
        searchRequest.setWaterRequirement(null);
        searchRequest.setCareDifficulty(null);
        searchRequest.setStatus(String.valueOf(Plants.PlantStatus.ACTIVE));
        searchRequest.setPage(0);
        searchRequest.setSize(10);
    }

    @Test
    void searchPlants_success() {
        // Dummy data
        PlantListResponseDTO plantDTO = new PlantListResponseDTO();
        plantDTO.setId(1L);
        plantDTO.setCommonName("Fern");

        Page<PlantListResponseDTO> mockPage = new PageImpl<>(
                Collections.singletonList(plantDTO),
                PageRequest.of(0, 10, Sort.by("commonName").ascending()),
                1
        );

        // Mock behavior
        when(plantRepository.searchPlants(
                anyString(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(Pageable.class))
        ).thenReturn(mockPage);

        // Execute
        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(searchRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Fern", result.getContent().get(0).getCommonName());

        System.out.println("✅ searchPlants_success: PASSED");
    }

    @Test
    void searchPlants_blankSortFields_shouldUseDefaultSorting() {
        searchRequest.setSortBy(null);
        searchRequest.setSortDirection(null);

        Page<PlantListResponseDTO> mockPage = new PageImpl<>(Collections.emptyList());

        when(plantRepository.searchPlants(
                anyString(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(Pageable.class))
        ).thenReturn(mockPage);

        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(searchRequest);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());

        System.out.println("✅ searchPlants_blankSortFields_shouldUseDefaultSorting: PASSED");
    }

    @Test
    void searchPlants_noResult_shouldReturnEmptyPage() {
        searchRequest.setKeyword("nonexistent");

        Page<PlantListResponseDTO> mockPage = new PageImpl<>(Collections.emptyList());

        when(plantRepository.searchPlants(
                anyString(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(Pageable.class))
        ).thenReturn(mockPage);

        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(searchRequest);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        System.out.println("✅ searchPlants_noResult_shouldReturnEmptyPage: PASSED");
    }
}
