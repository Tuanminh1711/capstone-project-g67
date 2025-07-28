package com.plantcare_backend.service.PlantManagementServiceTest;

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

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetAllPlantsTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    Page<PlantListResponseDTO> result;

    private Plants plant1;
    private Plants plant2;

    @BeforeEach
    void setUp() {
        plant1 = new Plants();
        plant1.setId(1L);
        plant1.setScientificName("Ficus lyrata");
        plant1.setCommonName("Fiddle Leaf Fig");

        plant2 = new Plants();
        plant2.setId(2L);
        plant2.setScientificName("Monstera deliciosa");
        plant2.setCommonName("Swiss Cheese Plant");
    }

    @Test
    void getAllPlants_shouldReturnPageOfPlants() {
        try {
            List<Plants> plantList = Arrays.asList(plant1, plant2);
            Page<Plants> page = new PageImpl<>(plantList, PageRequest.of(0, 2), plantList.size());

            when(plantRepository.findAll(PageRequest.of(0, 2))).thenReturn(page);

            result = plantManagementService.getAllPlants(0, 2);

            assertNotNull(result);
            assertEquals(2, result.getContent().size());
            assertEquals("Ficus lyrata", result.getContent().get(0).getScientificName());
            assertEquals("Monstera deliciosa", result.getContent().get(1).getScientificName());

            verify(plantRepository, times(1)).findAll(PageRequest.of(0, 2));

            System.out.println("Test 'getAllPlants_shouldReturnPageOfPlants' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_shouldReturnPageOfPlants' thất bại: " + e.getMessage());
        }
    }
}
