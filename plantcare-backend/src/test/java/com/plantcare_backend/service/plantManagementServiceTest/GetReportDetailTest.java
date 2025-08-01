package com.plantcare_backend.service.plantManagementServiceTest;


import com.plantcare_backend.dto.response.plantsManager.PlantReportDetailResponseDTO;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.PlantReportLogRepository;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import com.plantcare_backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GetReportDetailTest {

    @Mock
    private PlantReportRepository plantReportRepository;

    @Mock
    private PlantReportLogRepository plantReportLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private PlantReport mockReport;
    private Plants mockPlant;
    private Users reporter;
    private UserProfile userProfile;

    @BeforeEach
    void setUp() {
        mockReport = new PlantReport();
        mockReport.setReportId(1L);
        mockReport.setReason("Bad condition");
        mockReport.setStatus(PlantReport.ReportStatus.PENDING);
        mockReport.setAdminNotes("Check it soon");
        mockReport.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));

        mockPlant = new Plants();
        mockPlant.setId(100L);
        mockPlant.setCommonName("Rose");
        mockPlant.setScientificName("Rosa");
        mockPlant.setDescription("Nice flower");
        mockPlant.setStatus(Plants.PlantStatus.ACTIVE);

        PlantCategory category = new PlantCategory();
        category.setName("Flower");
        mockPlant.setCategory(category);

        PlantImage image = new PlantImage();
        image.setImageUrl("http://example.com/image.jpg");
        mockPlant.setImages(List.of(image));

        mockReport.setPlant(mockPlant);

        reporter = new Users();
        reporter.setId(10);
        reporter.setUsername("john_doe");
        reporter.setEmail("john@example.com");

        userProfile = new UserProfile();
        userProfile.setPhone("123456789");
        reporter.setUserProfile(userProfile);
        mockReport.setReporter(reporter);

        Users claimedBy = new Users();
        claimedBy.setId(20);
        claimedBy.setUsername("admin1");
        claimedBy.setEmail("admin1@example.com");
        mockReport.setClaimedBy(claimedBy);
        mockReport.setClaimedAt(Timestamp.valueOf(LocalDateTime.now()));

        Users handledBy = new Users();
        handledBy.setId(21);
        handledBy.setUsername("admin2");
        handledBy.setEmail("admin2@example.com");
        mockReport.setHandledBy(handledBy);
        mockReport.setHandledAt(Timestamp.valueOf(LocalDateTime.now()));
    }

    @Test
    void getReportDetail_success() {
        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(mockReport));
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantReportLogRepository.findByReport_ReportId(1L)).thenReturn(Collections.emptyList());

        PlantReportDetailResponseDTO dto = assertDoesNotThrow(() -> {
            return plantManagementService.getReportDetail(1L);
        });

        assertNotNull(dto);
        assertEquals(1L, dto.getReportId());
        assertEquals("Bad condition", dto.getReason());
        assertEquals("PENDING", dto.getStatus());
        assertEquals("Rose", dto.getPlantName());
        assertEquals("john_doe", dto.getReporterName());

        System.out.println("✅ getReportDetail_success: PASSED");
    }

    @Test
    void getReportDetail_reportNotFound_throwsException() {
        when(plantReportRepository.findById(999L)).thenReturn(Optional.empty());

        Exception ex = assertThrows(ResourceNotFoundException.class, () -> {
            plantManagementService.getReportDetail(999L);
        });

        assertEquals("Report not found with id: 999", ex.getMessage());
        System.out.println("✅ getReportDetail_reportNotFound_throwsException: PASSED");
    }

    @Test
    void getReportDetail_reporterProfileMissing_phoneNull() {
        reporter.setUserProfile(null); // Profile null
        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(mockReport));
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantReportLogRepository.findByReport_ReportId(1L)).thenReturn(Collections.emptyList());

        PlantReportDetailResponseDTO dto = plantManagementService.getReportDetail(1L);

        assertNull(dto.getReporterPhone());
        System.out.println("✅ getReportDetail_reporterProfileMissing_phoneNull: PASSED");
    }

    @Test
    void getReportDetail_plantImagesNull_noError() {
        mockPlant.setImages(null);
        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(mockReport));
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantReportLogRepository.findByReport_ReportId(1L)).thenReturn(Collections.emptyList());

        PlantReportDetailResponseDTO dto = plantManagementService.getReportDetail(1L);

        assertNotNull(dto.getPlantImageUrls());
        assertEquals(0, dto.getPlantImageUrls().size());
        System.out.println("✅ getReportDetail_plantImagesNull_noError: PASSED");
    }
}
