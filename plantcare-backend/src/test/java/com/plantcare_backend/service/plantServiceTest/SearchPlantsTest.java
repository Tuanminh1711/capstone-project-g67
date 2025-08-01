package com.plantcare_backend.service.plantServiceTest;


import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.dto.response.Plants.PlantResponseDTO;
import com.plantcare_backend.dto.response.Plants.PlantSearchResponseDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchPlantsTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantReportRepository plantReportRepository;


    @InjectMocks
    @Spy
    private PlantServiceImpl plantService;

    private PlantSearchRequestDTO request;
    private Plants plant1;
    private Plants plant2;

    @BeforeEach
    void setUp() {
        request = new PlantSearchRequestDTO();
        request.setKeyword("fern");
        request.setCategoryId(null);
        request.setLightRequirement(null);
        request.setWaterRequirement(null);
        request.setCareDifficulty(null);
        request.setStatus(null);
        request.setSortBy("commonName");
        request.setSortDirection("ASC");
        request.setPageNo(0);
        request.setPageSize(5);

        plant1 = new Plants();
        plant1.setId(1L);
        plant1.setCommonName("Boston Fern");
        plant1.setScientificName("Nephrolepis exaltata");

        plant2 = new Plants();
        plant2.setId(2L);
        plant2.setCommonName("Maidenhair Fern");
        plant2.setScientificName("Adiantum");
    }

    @Test
    void searchPlants_success_withResults() {
        try {
            Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "commonName"));
            Page<Plants> page = new PageImpl<>(List.of(plant1, plant2), pageable, 2);

            when(plantRepository.searchPlants(
                    eq("fern"),
                    isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(pageable)
            )).thenReturn(page);

            when(plantReportRepository.countByPlantId(anyLong())).thenReturn(0);

            PlantSearchResponseDTO result = plantService.searchPlants(request);

            assertNotNull(result);
            assertEquals(2, result.getTotalElements());
            assertEquals(1, result.getTotalPages());
            assertEquals(0, result.getCurrentPage());
            assertEquals(5, result.getPageSize());
            assertEquals(2, result.getPlants().size());
            assertEquals("Boston Fern", result.getPlants().get(0).getCommonName());

            verify(plantRepository, times(1)).searchPlants(
                    eq("fern"),
                    isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(pageable)
            );
            verify(plantReportRepository, atLeastOnce()).countByPlantId(anyLong());

            System.out.println("Test 'searchPlants_success_withResults' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_success_withResults' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_success_emptyResult() {
        try {
            Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "commonName"));
            Page<Plants> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(plantRepository.searchPlants(
                    eq("fern"),
                    isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(pageable)
            )).thenReturn(emptyPage);

            PlantSearchResponseDTO result = plantService.searchPlants(request);

            assertNotNull(result);
            assertEquals(0, result.getTotalElements());
            assertEquals(0, result.getTotalPages());
            assertTrue(result.getPlants().isEmpty());

            System.out.println("Test 'searchPlants_success_emptyResult' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_success_emptyResult' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_defaultSort_whenSortFieldsNull() {
        try {
            request.setSortBy(null);
            request.setSortDirection(null);

            Pageable expectedPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "commonName"));
            Page<Plants> emptyPage = new PageImpl<>(List.of(), expectedPageable, 0);

            when(plantRepository.searchPlants(
                    eq("fern"),
                    isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(expectedPageable)
            )).thenReturn(emptyPage);

            PlantSearchResponseDTO result = plantService.searchPlants(request);

            assertNotNull(result);
            assertEquals(0, result.getTotalElements());
            assertEquals(0, result.getTotalPages());

            System.out.println("Test 'searchPlants_defaultSort_whenSortFieldsNull' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_defaultSort_whenSortFieldsNull' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_descSort_customSortBy() {
        try {
            request.setSortBy("scientificName");
            request.setSortDirection("DESC");

            Pageable expected = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "scientificName"));
            Page<Plants> page = new PageImpl<>(List.of(plant1), expected, 1);

            when(plantRepository.searchPlants(
                    eq("fern"),
                    isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(expected)
            )).thenReturn(page);

            PlantSearchResponseDTO result = plantService.searchPlants(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(1, result.getPlants().size());
            assertEquals("Nephrolepis exaltata", result.getPlants().get(0).getScientificName());

            System.out.println("Test 'searchPlants_descSort_customSortBy' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_descSort_customSortBy' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_withFilters_shouldPassToRepository() {
        try {
            // Set full filters
            request.setKeyword("rose");
            request.setCategoryId(10L);
            request.setLightRequirement(Plants.LightRequirement.MEDIUM);
            request.setWaterRequirement(Plants.WaterRequirement.HIGH);
            request.setCareDifficulty(Plants.CareDifficulty.MODERATE);
            request.setStatus(Plants.PlantStatus.ACTIVE);

            Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "commonName"));
            Page<Plants> page = new PageImpl<>(List.of(plant1), pageable, 1);

            when(plantRepository.searchPlants(
                    eq("rose"),
                    eq(10L),
                    eq(Plants.LightRequirement.MEDIUM),
                    eq(Plants.WaterRequirement.HIGH),
                    eq(Plants.CareDifficulty.MODERATE),
                    eq(Plants.PlantStatus.ACTIVE),
                    eq(pageable)
            )).thenReturn(page);

            PlantSearchResponseDTO result = plantService.searchPlants(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(1, result.getPlants().size());

            verify(plantRepository, times(1)).searchPlants(
                    eq("rose"),
                    eq(10L),
                    eq(Plants.LightRequirement.MEDIUM),
                    eq(Plants.WaterRequirement.HIGH),
                    eq(Plants.CareDifficulty.MODERATE),
                    eq(Plants.PlantStatus.ACTIVE),
                    eq(pageable)
            );

            System.out.println("Test 'searchPlants_withFilters_shouldPassToRepository' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_withFilters_shouldPassToRepository' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_invalidPageNo_shouldThrow() {
        try {
            request.setPageNo(-1);

            assertThrows(IllegalArgumentException.class, () -> plantService.searchPlants(request));

            System.out.println("Test 'searchPlants_invalidPageNo_shouldThrow' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_invalidPageNo_shouldThrow' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    @Test
    void searchPlants_invalidPageSize_shouldThrow() {
        try {
            request.setPageSize(0);

            assertThrows(IllegalArgumentException.class, () -> plantService.searchPlants(request));

            System.out.println("Test 'searchPlants_invalidPageSize_shouldThrow' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_invalidPageSize_shouldThrow' thất bại: " + e.getMessage());
            fail(e);
        }
    }

    private Object makeDto(Plants p) {
        PlantResponseDTO dto = new PlantResponseDTO();
        dto.setId(p.getId());
        dto.setCommonName(p.getCommonName());
        dto.setScientificName(p.getScientificName());
        return dto;
    }

    @Test
    void searchPlants_allFiltersEmpty_shouldReturnAll() {
        try {
            // --- Input: tất cả filter rỗng/null
            PlantSearchRequestDTO req = new PlantSearchRequestDTO();
            req.setKeyword(null);
            req.setCategoryId(null);
            req.setLightRequirement(null);
            req.setWaterRequirement(null);
            req.setCareDifficulty(null);
            req.setStatus(null);
            req.setSortBy(null);          // sẽ dùng default = commonName
            req.setSortDirection(null);   // sẽ dùng default = ASC
            req.setPageNo(0);
            req.setPageSize(10);

            // --- Dữ liệu giả
            Plants p1 = new Plants(); p1.setId(1L); p1.setCommonName("Aloe");      p1.setScientificName("Aloe vera");
            Plants p2 = new Plants(); p2.setId(2L); p2.setCommonName("Monstera");  p2.setScientificName("Monstera deliciosa");
            Plants p3 = new Plants(); p3.setId(3L); p3.setCommonName("Ficus");     p3.setScientificName("Ficus elastica");
            List<Plants> all = List.of(p1, p2, p3);

            Pageable expectedPageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "commonName"));
            Page<Plants> page = new PageImpl<>(all, expectedPageable, all.size());

            // --- Khi tất cả filter null → repository nhận toàn null (trừ pageable)
            when(plantRepository.searchPlants(
                    isNull(),   // keyword
                    isNull(),   // categoryId
                    isNull(),   // lightRequirement
                    isNull(),   // waterRequirement
                    isNull(),   // careDifficulty
                    isNull(),   // status
                    eq(expectedPageable)
            )).thenReturn(page);

            // --- Stub tối thiểu cho mapper (nếu convertToPlantResponseDTO có dùng)
            when(plantReportRepository.countByPlantId(anyLong())).thenReturn(0);

            // --- Gọi hàm
            PlantSearchResponseDTO result = plantService.searchPlants(req);

            // --- Kiểm tra
            assertNotNull(result);
            assertEquals(3, result.getTotalElements());
            assertEquals(1, result.getTotalPages());     // 3 items / size 10 = 1 trang
            assertEquals(0, result.getCurrentPage());
            assertEquals(10, result.getPageSize());
            assertEquals(3, result.getPlants().size());
            assertEquals("Aloe",     result.getPlants().get(0).getCommonName());
            assertEquals("Monstera", result.getPlants().get(1).getCommonName());
            assertEquals("Ficus",    result.getPlants().get(2).getCommonName());

            verify(plantRepository, times(1)).searchPlants(
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(expectedPageable)
            );

            System.out.println("Test 'searchPlants_allFiltersEmpty_shouldReturnAll' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchPlants_allFiltersEmpty_shouldReturnAll' thất bại: " + e.getMessage());
            fail(e);
        }
    }

}
