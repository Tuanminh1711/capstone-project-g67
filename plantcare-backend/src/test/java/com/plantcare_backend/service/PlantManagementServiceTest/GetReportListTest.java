package com.plantcare_backend.service.PlantManagementServiceTest;

import com.plantcare_backend.dto.request.plantsManager.PlantReportSearchRequestDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportListResponseDTO;
import com.plantcare_backend.model.PlantReport;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetReportListTest {

    @Mock
    private PlantReportRepository plantReportRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantService;

    private PlantReport report;

    @BeforeEach
    void setUp() {
        report = new PlantReport();
        report.setReportId(1L);
        report.setReason("Missing care info");
        report.setStatus(PlantReport.ReportStatus.PENDING);

        Plants mockPlant = new Plants();
        mockPlant.setId(101L);
        mockPlant.setCommonName("Rose");
        report.setPlant(mockPlant);

        Users mockUser = new Users();
        mockUser.setId(202);
        mockUser.setUsername("user123");
        report.setReporter(mockUser); // 👈 Cần thêm dòng này
    }


    @Test
    void getReportList_withValidStatus_shouldReturnResult() {
        PlantReportSearchRequestDTO request = new PlantReportSearchRequestDTO();
        request.setStatus("PENDING");
        request.setPlantName("Rose");
        request.setReporterName("user123");
        request.setPage(0);
        request.setSize(5);

        Page<PlantReport> reportPage = new PageImpl<>(
                List.of(report),
                PageRequest.of(0, 5),
                1
        );

        when(plantReportRepository.findReportsWithFilters(
                PlantReport.ReportStatus.PENDING, "Rose", "user123",
                PageRequest.of(0, 5))
        ).thenReturn(reportPage);

        PlantReportListResponseDTO response = plantService.getReportList(request);

        assertEquals(1, response.getReports().size());
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getTotalPages());
        assertEquals(0, response.getCurrentPage());
        assertEquals(5, response.getPageSize());

        System.out.println("✅ Test 'getReportList_withValidStatus_shouldReturnResult' passed.");
    }

    @Test
    void getReportList_withNullStatus_shouldReturnResult() {
        PlantReportSearchRequestDTO request = new PlantReportSearchRequestDTO();
        request.setStatus(null);
        request.setPlantName(null);
        request.setReporterName(null);
        request.setPage(0);
        request.setSize(10);

        Page<PlantReport> reportPage = new PageImpl<>(
                List.of(report),
                PageRequest.of(0, 10),
                1
        );

        when(plantReportRepository.findReportsWithFilters(
                null, null, null, PageRequest.of(0, 10))
        ).thenReturn(reportPage);

        PlantReportListResponseDTO response = plantService.getReportList(request);

        assertEquals(1, response.getReports().size());
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getTotalPages());

        System.out.println("✅ Test 'getReportList_withNullStatus_shouldReturnResult' passed.");
    }

    @Test
    void getReportList_withEmptyResult_shouldReturnEmptyList() {
        PlantReportSearchRequestDTO request = new PlantReportSearchRequestDTO();
        request.setStatus("CLAIMED");
        request.setPage(0);
        request.setSize(5);

        Page<PlantReport> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 5), 0);

        when(plantReportRepository.findReportsWithFilters(
                PlantReport.ReportStatus.CLAIMED, null, null, PageRequest.of(0, 5))
        ).thenReturn(emptyPage);

        PlantReportListResponseDTO response = plantService.getReportList(request);

        assertNotNull(response);
        assertTrue(response.getReports().isEmpty());
        assertEquals(0, response.getTotalElements());

        System.out.println("✅ Test 'getReportList_withEmptyResult_shouldReturnEmptyList' passed.");
    }

    @Test
    void getReportList_withInvalidStatus_shouldThrowException() {
        PlantReportSearchRequestDTO request = new PlantReportSearchRequestDTO();
        request.setStatus("INVALID_STATUS");

        assertThrows(IllegalArgumentException.class, () ->
                plantService.getReportList(request));

        System.out.println("✅ Test 'getReportList_withInvalidStatus_shouldThrowException' passed.");
    }

    @Test
    void getAllPlants_invalidPageNumber_shouldThrowException() {
        try {
            assertThrows(IllegalArgumentException.class, () -> {
                plantService.getAllPlants(-1, 10);
            });

            System.out.println("Test 'getAllPlants_invalidPageNumber_shouldThrowException' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_invalidPageNumber_shouldThrowException' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllPlants_invalidPageSize_shouldThrowException() {
        try {
            assertThrows(IllegalArgumentException.class, () -> {
                plantService.getAllPlants(0, -5);
            });

            System.out.println("Test 'getAllPlants_invalidPageSize_shouldThrowException' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllPlants_invalidPageSize_shouldThrowException' thất bại: " + e.getMessage());
        }
    }
}
