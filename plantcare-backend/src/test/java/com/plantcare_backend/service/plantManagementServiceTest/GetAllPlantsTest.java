package com.plantcare_backend.service.plantManagementServiceTest;

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

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class GetAllPlantsTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private Plants plant1;
    private Plants plant2;
    private Page<Plants> plantsPage;
    Page<PlantListResponseDTO> responsePage;


    @BeforeEach
    void setUp() {
        plant1 = new Plants();
        plant1.setId(1L);
        plant1.setCommonName("Aloe Vera");
        plant1.setScientificName("Aloe barbadensis miller");

        plant2 = new Plants();
        plant2.setId(2L);
        plant2.setCommonName("Peace Lily");
        plant2.setScientificName("Spathiphyllum wallisii");

        List<Plants> plants = List.of(plant1, plant2);
        plantsPage = new PageImpl<>(plants);
    }

    @Test
    void getAllPlants_success() {
        try {
            given(plantRepository.findAll(PageRequest.of(0, 10))).willReturn(plantsPage);

            responsePage = plantManagementService.getAllPlants(0, 10);

            assertEquals(2, responsePage.getTotalElements());
            assertEquals("Aloe Vera", responsePage.getContent().get(0).getCommonName());
            assertEquals("Peace Lily", responsePage.getContent().get(1).getCommonName());

            verify(plantRepository).findAll(PageRequest.of(0, 10));

            System.out.println("Test 'getAllPlants_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllPlants_emptyList() {
        try {
            Page<Plants> emptyPage = new PageImpl<>(Collections.emptyList());
            given(plantRepository.findAll(PageRequest.of(0, 10))).willReturn(emptyPage);

            Page<PlantListResponseDTO> responsePage = plantManagementService.getAllPlants(0, 10);

            assertNotNull(responsePage);
            assertTrue(responsePage.getContent().isEmpty());

            System.out.println("Test 'getAllPlants_emptyList' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_emptyList' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllPlants_invalidPageNo() {
        try {
            assertThrows(IllegalArgumentException.class, () -> {
                plantManagementService.getAllPlants(-1, 10);
            });

            System.out.println("Test 'getAllPlants_invalidPageNo' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_invalidPageNo' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllPlants_invalidPageSize() {
        try {
            assertThrows(IllegalArgumentException.class, () -> {
                plantManagementService.getAllPlants(0, -5);
            });

            System.out.println("Test 'getAllPlants_invalidPageSize' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_invalidPageSize' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllPlants_withExcessivePageSize() {
        try{
        int veryLargePageSize = 10_000;
        Page<Plants> usersPage = new PageImpl<>(List.of(plant1));
        given(plantRepository.findAll(PageRequest.of(0, veryLargePageSize))).willReturn(usersPage);

        Page<PlantListResponseDTO> responses = plantManagementService.getAllPlants(0, veryLargePageSize);

        assertEquals(1, responses.getSize());
            System.out.println("Test 'getAllPlants_withExcessivePageSize' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_withExcessivePageSize' thất bại: " + e.getMessage());
        }
    }
}
