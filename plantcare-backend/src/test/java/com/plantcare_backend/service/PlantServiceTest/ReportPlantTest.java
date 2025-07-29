package com.plantcare_backend.service.PlantServiceTest;

import com.plantcare_backend.dto.request.plantsManager.PlantReportRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantReport;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantReportRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.PlantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportPlantTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantReportRepository plantReportRepository;

    @InjectMocks
    private PlantServiceImpl plantService;

    private Users reporter;
    private Plants activePlant;
    private Plants inactivePlant;
    private PlantReportRequestDTO request;

    @BeforeEach
    void setUp() {
        reporter = new Users();
        // Service dùng Math.toIntExact(reporterId) => Users.id nên là Integer
        reporter.setId(123);

        activePlant = new Plants();
        activePlant.setId(10L);
        activePlant.setStatus(Plants.PlantStatus.ACTIVE);

        inactivePlant = new Plants();
        inactivePlant.setId(11L);
        inactivePlant.setStatus(Plants.PlantStatus.INACTIVE);

        request = new PlantReportRequestDTO();
        request.setPlantId(10L);
        request.setReason("Nội dung sai lệch");
    }

    @Test
    void reportPlant_shouldCreatePendingReport_whenCountLessThan3_andNotLockPlant() {
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(request.getPlantId())).thenReturn(Optional.of(activePlant));
        when(plantReportRepository.existsByPlantAndReporterAndStatus(
                activePlant, reporter, PlantReport.ReportStatus.PENDING)).thenReturn(false);
        when(plantReportRepository.countByPlantId(activePlant.getId())).thenReturn(2); // < 3

        plantService.reportPlant(request, (long) reporter.getId());

        verify(plantReportRepository, times(1)).save(any(PlantReport.class));
        verify(plantReportRepository, times(1)).countByPlantId(activePlant.getId());
        // Không đổi trạng thái khi < 3
        assertEquals(Plants.PlantStatus.ACTIVE, activePlant.getStatus());
        verify(plantRepository, never()).save(activePlant);

        System.out.println("✅ reportPlant_shouldCreatePendingReport_whenCountLessThan3_andNotLockPlant: PASSED");
    }

    @Test
    void reportPlant_shouldLockPlant_whenCountAtLeast3() {
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(request.getPlantId())).thenReturn(Optional.of(activePlant));
        when(plantReportRepository.existsByPlantAndReporterAndStatus(
                activePlant, reporter, PlantReport.ReportStatus.PENDING)).thenReturn(false);
        when(plantReportRepository.countByPlantId(activePlant.getId())).thenReturn(3); // >= 3

        plantService.reportPlant(request, (long) reporter.getId());

        assertEquals(Plants.PlantStatus.INACTIVE, activePlant.getStatus());
        verify(plantRepository, times(1)).save(activePlant);
        verify(plantReportRepository, times(1)).save(any(PlantReport.class));
        verify(plantReportRepository, times(1)).countByPlantId(activePlant.getId());

        System.out.println("✅ reportPlant_shouldLockPlant_whenCountAtLeast3: PASSED");
    }

    @Test
    void reportPlant_shouldThrow_whenPlantAlreadyInactive() {
        // đổi plantId sang cây đã INACTIVE
        request.setPlantId(inactivePlant.getId());

        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(inactivePlant.getId())).thenReturn(Optional.of(inactivePlant));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> plantService.reportPlant(request, (long) reporter.getId()));
        assertEquals("Cây này đã bị khóa do bị report quá nhiều!", ex.getMessage());

        verify(plantReportRepository, never()).save(any());
        verify(plantReportRepository, never()).countByPlantId(anyLong());
        verify(plantRepository, never()).save(any());

        System.out.println("✅ reportPlant_shouldThrow_whenPlantAlreadyInactive: PASSED");
    }

    @Test
    void reportPlant_shouldThrow_whenDuplicatePendingReport() {
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(request.getPlantId())).thenReturn(Optional.of(activePlant));
        when(plantReportRepository.existsByPlantAndReporterAndStatus(
                activePlant, reporter, PlantReport.ReportStatus.PENDING)).thenReturn(true); // đã report pending

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> plantService.reportPlant(request, (long) reporter.getId()));
        assertEquals("Bạn đã report cây này rồi! vui lòng chờ xử lý.", ex.getMessage());

        verify(plantReportRepository, never()).save(any());
        verify(plantReportRepository, never()).countByPlantId(anyLong());
        verify(plantRepository, never()).save(any());

        System.out.println("✅ reportPlant_shouldThrow_whenDuplicatePendingReport: PASSED");
    }

    @Test
    void reportPlant_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> plantService.reportPlant(request, (long) reporter.getId()));

        verify(plantRepository, never()).findById(anyLong());
        verify(plantReportRepository, never()).existsByPlantAndReporterAndStatus(any(), any(), any());
        verify(plantReportRepository, never()).save(any());
        verify(plantRepository, never()).save(any());

        System.out.println("✅ reportPlant_shouldThrow_whenUserNotFound: PASSED");
    }

    @Test
    void reportPlant_shouldThrow_whenPlantNotFound() {
        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(request.getPlantId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> plantService.reportPlant(request, (long) reporter.getId()));

        verify(plantReportRepository, never()).existsByPlantAndReporterAndStatus(any(), any(), any());
        verify(plantReportRepository, never()).save(any());
        verify(plantRepository, never()).save(any());

        System.out.println("✅ reportPlant_shouldThrow_whenPlantNotFound: PASSED");
    }

    @Test
    void reportPlant_shouldThrow_whenReasonIsBlank() {
        // given
        request.setReason("   "); // chuỗi chỉ toàn khoảng trắng

        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));
        when(plantRepository.findById(request.getPlantId())).thenReturn(Optional.of(activePlant));
        when(plantReportRepository.existsByPlantAndReporterAndStatus(
                activePlant, reporter, PlantReport.ReportStatus.PENDING)).thenReturn(false);

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> plantService.reportPlant(request, (long) reporter.getId()));

        assertEquals("Lý do report không được để trống", ex.getMessage());

        verify(plantReportRepository, never()).save(any());
        verify(plantRepository, never()).save(any());

        System.out.println("✅ reportPlant_shouldThrow_whenReasonIsBlank: PASSED");
    }

}
