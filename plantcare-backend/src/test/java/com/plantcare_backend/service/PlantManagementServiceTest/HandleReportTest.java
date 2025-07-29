package com.plantcare_backend.service.PlantManagementServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantReport;
import com.plantcare_backend.model.PlantReportLog;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantReportLogRepository;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HandleReportTest {

    @Mock
    private PlantReportRepository plantReportRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlantReportLogRepository plantReportLogRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private PlantReport report;
    private Plants plant;
    private Users staff;
    private Users reporter;

    @BeforeEach
    void setUp() {
        staff = new Users();
        staff.setId(1);

        reporter = new Users();
        reporter.setId(2);
        reporter.setEmail("reporter@example.com");
        reporter.setUsername("reporterUser");

        plant = new Plants();
        plant.setId(10L);
        plant.setCommonName("Aloe Vera");
        plant.setStatus(Plants.PlantStatus.INACTIVE);

        report = new PlantReport();
        report.setReportId(100L);
        report.setStatus(PlantReport.ReportStatus.PENDING);
        report.setClaimedBy(staff);
        report.setPlant(plant);
    }

    @Test
    void handleReport_success() {
        report.setReporter(Users.builder()
                .id(3)
                .username("reporter1")
                .email("reporter@example.com")
                .build());

        when(plantReportRepository.findById(100L)).thenReturn(Optional.of(report));
        when(plantReportRepository.findByPlant_Id(10L)).thenReturn(List.of(report));
        when(plantReportRepository.countByPlantIdAndStatusIn(eq(10L), anyList())).thenReturn(0);

        plantManagementService.handleReport(100L, "APPROVED", "Tình trạng ổn", 1);

        verify(plantReportRepository).save(report);
        verify(plantRepository).save(plant);
        verify(emailService).sendEmailAsync(eq("reporter@example.com"), contains("Aloe Vera"), contains("APPROVED"));
        verify(plantReportLogRepository).save(any(PlantReportLog.class));

        System.out.println("Test 'handleReport_success' passed.");
    }

    @Test
    void handleReport_reportNotFound() {
        when(plantReportRepository.findById(999L)).thenReturn(Optional.empty());

        Exception exception = assertThrows(ResourceNotFoundException.class, () ->
                plantManagementService.handleReport(999L, "APPROVED", "Không đúng sự thật", 1));

        System.out.println("Test 'handleReport_reportNotFound' passed: " + exception.getMessage());
    }

    @Test
    void handleReport_userNotClaimedThisReport() {
        Users anotherUser = new Users();
        anotherUser.setId(999);

        report.setClaimedBy(anotherUser);
        when(plantReportRepository.findById(100L)).thenReturn(Optional.of(report));

        Exception exception = assertThrows(IllegalStateException.class, () ->
                plantManagementService.handleReport(100L, "APPROVED", "Không đúng sự thật", 1));

        System.out.println("Test 'handleReport_userNotClaimedThisReport' passed: " + exception.getMessage());
    }

    @Test
    void handleReport_invalidStatusEnum() {
        when(plantReportRepository.findById(100L)).thenReturn(Optional.of(report));

        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                plantManagementService.handleReport(100L, "INVALID_STATUS", "Note", 1));

        System.out.println("Test 'handleReport_invalidStatusEnum' passed: " + exception.getMessage());
    }

    @Test
    void handleReport_notClaimed_throwsException() {
        Long reportId = 1L;
        String status = "APPROVED";
        String adminNotes = "Valid report";
        Integer userId = 123;

        Users admin = new Users();
        admin.setId(userId);
        admin.setUsername("admin");

        PlantReport pendingReport = new PlantReport();
        pendingReport.setReportId(reportId);
        pendingReport.setStatus(PlantReport.ReportStatus.PENDING); // ❗ chưa được CLAIM

        when(plantReportRepository.findById(reportId)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findById(userId)).thenReturn(Optional.of(admin));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            plantManagementService.handleReport(reportId, status, adminNotes, userId);
        });

        assertEquals("Report must be claimed before handling", exception.getMessage());

        System.out.println("✅ handleReport_notClaimed_throwsException: PASSED");
    }

    @Test
    void handleReport_blankStatus_throwsException() {
        Long reportId = 1L;
        String adminNotes = "Valid note";
        Integer userId = 1;

        assertThrows(IllegalArgumentException.class, () -> {
            plantManagementService.handleReport(reportId, "", adminNotes, userId);
        });

        System.out.println("✅ handleReport_blankStatus_throwsException: PASSED");
    }

    @Test
    void handleReport_blankAdminNotes_successIfOptional() {
        Long reportId = 1L;
        String status = "REJECTED";
        String adminNotes = "";
        Integer userId = 1;

        // Mock user xử lý
        Users admin = new Users();
        admin.setId(userId);
        admin.setUsername("adminUser");

        Plants plant = new Plants();
        plant.setId(10L);
        plant.setCommonName("Cây Lưỡi Hổ");
        plant.setStatus(Plants.PlantStatus.INACTIVE);

        PlantReport report = new PlantReport();
        report.setStatus(PlantReport.ReportStatus.CLAIMED);
        report.setClaimedBy(admin);
        report.setPlant(plant);

        PlantReport otherReport = new PlantReport();
        otherReport.setReporter(admin);
        otherReport.setPlant(plant);

        when(plantReportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(plantReportRepository.findByPlant_Id(plant.getId())).thenReturn(List.of(otherReport));
        when(plantReportRepository.countByPlantIdAndStatusIn(eq(plant.getId()), any())).thenReturn(0);

        assertDoesNotThrow(() -> {
            plantManagementService.handleReport(reportId, status, adminNotes, userId);
        });

        System.out.println("✅ handleReport_blankAdminNotes_successIfOptional: PASSED");
    }


}
