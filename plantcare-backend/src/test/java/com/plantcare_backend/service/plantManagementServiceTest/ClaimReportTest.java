package com.plantcare_backend.service.plantManagementServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantReport;
import com.plantcare_backend.model.PlantReportLog;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantReportLogRepository;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.PlantManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClaimReportTest {

    @Mock
    private PlantReportRepository plantReportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlantReportLogRepository plantReportLogRepository;

    @InjectMocks
    private PlantManagementServiceImpl plantManagementService;

    private PlantReport plantReport;
    private Users staff;

    @BeforeEach
    void setup() {
        staff = Users.builder()
                .id(10)
                .username("staffUser")
                .build();

        plantReport = PlantReport.builder()
                .reportId(1L)
                .claimedBy(null)
                .status(PlantReport.ReportStatus.PENDING)
                .build();
    }

    @Test
    void claimReport_success() {
        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(plantReport));
        when(userRepository.findById(10)).thenReturn(Optional.of(staff));
        when(plantReportRepository.save(any(PlantReport.class))).thenAnswer(i -> i.getArgument(0));
        when(plantReportLogRepository.save(any(PlantReportLog.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> plantManagementService.claimReport(1L, 10));

        assertEquals(PlantReport.ReportStatus.CLAIMED, plantReport.getStatus());
        assertEquals(staff, plantReport.getClaimedBy());
        assertNotNull(plantReport.getClaimedAt());

        verify(plantReportRepository).save(plantReport);
        verify(plantReportLogRepository).save(any(PlantReportLog.class));

        System.out.println("Test 'claimReport_success' thành công");
    }

    @Test
    void claimReport_reportNotFound_shouldThrow() {
        when(plantReportRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> plantManagementService.claimReport(999L, 10));

        assertEquals("Report not found", ex.getMessage());
        System.out.println("Test 'claimReport_reportNotFound_shouldThrow' thành công");
    }

    @Test
    void claimReport_userNotFound_shouldThrow() {
        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(plantReport));
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> plantManagementService.claimReport(1L, 999));

        assertEquals("user not found", ex.getMessage());
        System.out.println("Test 'claimReport_userNotFound_shouldThrow' thành công");
    }

    @Test
    void claimReport_alreadyClaimed_shouldThrow() {
        plantReport.setClaimedBy(new Users()); // Đã có người nhận xử lý

        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(plantReport));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> plantManagementService.claimReport(1L, 10));

        assertEquals("Report đã được nhận sử lý bởi người khác!", ex.getMessage());
        System.out.println("Test 'claimReport_alreadyClaimed_shouldThrow' thành công");
    }

    @Test
    void claimReport_statusNotPending_shouldThrow() {
        plantReport.setStatus(PlantReport.ReportStatus.APPROVED);

        when(plantReportRepository.findById(1L)).thenReturn(Optional.of(plantReport));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> plantManagementService.claimReport(1L, 10));

        assertEquals("Chỉ có thể nhận xử lý report đang chờ xử lý (PENDING)", ex.getMessage());
        System.out.println("Test 'claimReport_statusNotPending_shouldThrow' thành công");
    }

}
