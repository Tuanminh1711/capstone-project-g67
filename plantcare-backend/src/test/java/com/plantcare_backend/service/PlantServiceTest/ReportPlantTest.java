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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportPlantTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private PlantReportRepository plantReportRepository;

    @InjectMocks
    private PlantServiceImpl plantService;

    // Test 1: User does not exist
    @Test
    void testReportPlant_WhenUserDoesNotExist_ShouldThrowException() {
        // Arrange
        Long reporterId = 1L;
        Long plantId = 1L;
        String reason = "Inappropriate content";

        PlantReportRequestDTO request = new PlantReportRequestDTO();
        request.setPlantId(plantId);
        request.setReason(reason);

        // Mock userRepository.findById returns empty
        when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> plantService.reportPlant(request, reporterId)
        );

        assertEquals("User not found", exception.getMessage());

        // Verify that userRepository.findById was called with correct parameter
        verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
        
        // Verify that other repositories were not called since exception was thrown early
        verify(plantRepository, never()).findById(any());
        verify(plantReportRepository, never()).existsByPlantAndReporterAndStatus(any(), any(), any());
        verify(plantReportRepository, never()).save(any());
        verify(plantReportRepository, never()).countByPlantId(any());
    }

    // Test 2: Plant does not exist
    @Test
    void testReportPlant_WhenPlantDoesNotExist_ShouldThrowException() {
        // Arrange
        Long reporterId = 1L;
        Long plantId = 1L;
        String reason = "Inappropriate content";

        PlantReportRequestDTO request = new PlantReportRequestDTO();
        request.setPlantId(plantId);
        request.setReason(reason);

        // Mock user exists
        Users mockUser = Users.builder()
                .id(Math.toIntExact(reporterId))
                .username("testuser")
                .email("test@example.com")
                .build();

        // Mock plantRepository.findById returns empty
        when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
        when(plantRepository.findById(plantId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> plantService.reportPlant(request, reporterId)
        );

        assertEquals("Plant not found", exception.getMessage());

        // Verify that userRepository.findById was called
        verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
        
        // Verify that plantRepository.findById was called with correct parameter
        verify(plantRepository, times(1)).findById(plantId);
        
                 // Verify that other repositories were not called since exception was thrown
         verify(plantReportRepository, never()).existsByPlantAndReporterAndStatus(any(), any(), any());
         verify(plantReportRepository, never()).save(any());
         verify(plantReportRepository, never()).countByPlantId(any());
     }

     // Test 3: Plant is INACTIVE
     @Test
     void testReportPlant_WhenPlantIsInactive_ShouldThrowException() {
         // Arrange
         Long reporterId = 1L;
         Long plantId = 1L;
         String reason = "Inappropriate content";

         PlantReportRequestDTO request = new PlantReportRequestDTO();
         request.setPlantId(plantId);
         request.setReason(reason);

         // Mock user exists
         Users mockUser = Users.builder()
                 .id(Math.toIntExact(reporterId))
                 .username("testuser")
                 .email("test@example.com")
                 .build();

         // Mock plant exists but is INACTIVE
         Plants mockPlant = Plants.builder()
                 .id(plantId)
                 .scientificName("Test Plant")
                 .commonName("Test Common Name")
                 .status(Plants.PlantStatus.INACTIVE) // Plant is INACTIVE
                 .build();

         when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
         when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));

         // Act & Assert
         IllegalArgumentException exception = assertThrows(
                 IllegalArgumentException.class,
                 () -> plantService.reportPlant(request, reporterId)
         );

         assertEquals("Cây này đã bị khóa do bị report quá nhiều!", exception.getMessage());

         // Verify that userRepository.findById was called
         verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
         
         // Verify that plantRepository.findById was called with correct parameter
         verify(plantRepository, times(1)).findById(plantId);
         
         // Verify that other repositories were not called since exception was thrown
         verify(plantReportRepository, never()).existsByPlantAndReporterAndStatus(any(), any(), any());
         verify(plantReportRepository, never()).save(any());
         verify(plantReportRepository, never()).countByPlantId(any());
     }

     // Test 4: User already reported this plant
     @Test
     void testReportPlant_WhenUserAlreadyReportedPlant_ShouldThrowException() {
         // Arrange
         Long reporterId = 1L;
         Long plantId = 1L;
         String reason = "Inappropriate content";

         PlantReportRequestDTO request = new PlantReportRequestDTO();
         request.setPlantId(plantId);
         request.setReason(reason);

         // Mock user exists
         Users mockUser = Users.builder()
                 .id(Math.toIntExact(reporterId))
                 .username("testuser")
                 .email("test@example.com")
                 .build();

         // Mock plant exists and is ACTIVE
         Plants mockPlant = Plants.builder()
                 .id(plantId)
                 .scientificName("Test Plant")
                 .commonName("Test Common Name")
                 .status(Plants.PlantStatus.ACTIVE) // Plant is ACTIVE
                 .build();

         when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
         when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));
         
         // Mock that user already reported this plant (PENDING status)
         when(plantReportRepository.existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         )).thenReturn(true);

         // Act & Assert
         IllegalArgumentException exception = assertThrows(
                 IllegalArgumentException.class,
                 () -> plantService.reportPlant(request, reporterId)
         );

         assertEquals("Bạn đã report cây này rồi! vui lòng chờ xử lý.", exception.getMessage());

         // Verify that userRepository.findById was called
         verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
         
         // Verify that plantRepository.findById was called with correct parameter
         verify(plantRepository, times(1)).findById(plantId);
         
         // Verify that plantReportRepository.existsByPlantAndReporterAndStatus was called
         verify(plantReportRepository, times(1)).existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         );
         
         // Verify that other repositories were not called since exception was thrown
         verify(plantReportRepository, never()).save(any());
         verify(plantReportRepository, never()).countByPlantId(any());
     }

     // Test 5: All valid, report count < 3
     @Test
     void testReportPlant_WhenAllValidAndReportCountLessThan3_ShouldCreateReportAndKeepPlantActive() {
         // Arrange
         Long reporterId = 1L;
         Long plantId = 1L;
         String reason = "Inappropriate content";

         PlantReportRequestDTO request = new PlantReportRequestDTO();
         request.setPlantId(plantId);
         request.setReason(reason);

         // Mock user exists
         Users mockUser = Users.builder()
                 .id(Math.toIntExact(reporterId))
                 .username("testuser")
                 .email("test@example.com")
                 .build();

         // Mock plant exists and is ACTIVE
         Plants mockPlant = Plants.builder()
                 .id(plantId)
                 .scientificName("Test Plant")
                 .commonName("Test Common Name")
                 .status(Plants.PlantStatus.ACTIVE) // Plant is ACTIVE
                 .build();

         when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
         when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));
         
         // Mock that user has not reported this plant before
         when(plantReportRepository.existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         )).thenReturn(false);

         // Mock save report
         PlantReport savedReport = PlantReport.builder()
                 .reportId(1L)
                 .plant(mockPlant)
                 .reporter(mockUser)
                 .reason(reason)
                 .status(PlantReport.ReportStatus.PENDING)
                 .build();
         when(plantReportRepository.save(any(PlantReport.class))).thenReturn(savedReport);

         // Mock report count < 3 (existing reports: 0, new report: 1, total: 1)
         when(plantReportRepository.countByPlantId(plantId)).thenReturn(1);

         // Act
         plantService.reportPlant(request, reporterId);

         // Assert
         // Verify that userRepository.findById was called
         verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
         
         // Verify that plantRepository.findById was called with correct parameter
         verify(plantRepository, times(1)).findById(plantId);
         
         // Verify that plantReportRepository.existsByPlantAndReporterAndStatus was called
         verify(plantReportRepository, times(1)).existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         );
         
         // Verify that plantReportRepository.save was called with correct report
         verify(plantReportRepository, times(1)).save(argThat(report -> 
                 report.getPlant().equals(mockPlant) &&
                 report.getReporter().equals(mockUser) &&
                 report.getReason().equals(reason) &&
                 report.getStatus().equals(PlantReport.ReportStatus.PENDING)
         ));
         
         // Verify that plantReportRepository.countByPlantId was called
         verify(plantReportRepository, times(1)).countByPlantId(plantId);
         
         // Verify that plant status was NOT changed (no save call on plant)
         verify(plantRepository, never()).save(any(Plants.class));
     }

     // Test 6: Reason is empty string
     @Test
     void testReportPlant_WhenReasonIsEmpty_ShouldThrowException() {
         // Arrange
         Long reporterId = 1L;
         Long plantId = 1L;
         String reason = ""; // Empty reason

         PlantReportRequestDTO request = new PlantReportRequestDTO();
         request.setPlantId(plantId);
         request.setReason(reason);

         // Mock user exists
         Users mockUser = Users.builder()
                 .id(Math.toIntExact(reporterId))
                 .username("testuser")
                 .email("test@example.com")
                 .build();

         // Mock plant exists and is ACTIVE
         Plants mockPlant = Plants.builder()
                 .id(plantId)
                 .scientificName("Test Plant")
                 .commonName("Test Common Name")
                 .status(Plants.PlantStatus.ACTIVE) // Plant is ACTIVE
                 .build();

         when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
         when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));
         
         // Mock that user has not reported this plant before
         when(plantReportRepository.existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         )).thenReturn(false);

         // Act & Assert
         IllegalArgumentException exception = assertThrows(
                 IllegalArgumentException.class,
                 () -> plantService.reportPlant(request, reporterId)
         );

         // Verify that userRepository.findById was called
         verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
         
         // Verify that plantRepository.findById was called with correct parameter
         verify(plantRepository, times(1)).findById(plantId);
         
         // Verify that plantReportRepository.existsByPlantAndReporterAndStatus was called
         verify(plantReportRepository, times(1)).existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         );
         
         // Verify that other repositories were not called since exception was thrown
         verify(plantReportRepository, never()).save(any());
         verify(plantReportRepository, never()).countByPlantId(any());
         verify(plantRepository, never()).save(any(Plants.class));
     }

     // Test 7: All valid, report count >= 3, plant status changed to INACTIVE
     @Test
     void testReportPlant_WhenAllValidAndReportCountGreaterThanOrEqualTo3_ShouldCreateReportAndChangePlantToInactive() {
         // Arrange
         Long reporterId = 1L;
         Long plantId = 1L;
         String reason = "Inappropriate content";

         PlantReportRequestDTO request = new PlantReportRequestDTO();
         request.setPlantId(plantId);
         request.setReason(reason);

         // Mock user exists
         Users mockUser = Users.builder()
                 .id(Math.toIntExact(reporterId))
                 .username("testuser")
                 .email("test@example.com")
                 .build();

         // Mock plant exists and is ACTIVE
         Plants mockPlant = Plants.builder()
                 .id(plantId)
                 .scientificName("Test Plant")
                 .commonName("Test Common Name")
                 .status(Plants.PlantStatus.ACTIVE) // Plant is ACTIVE initially
                 .build();

         when(userRepository.findById(Math.toIntExact(reporterId))).thenReturn(Optional.of(mockUser));
         when(plantRepository.findById(plantId)).thenReturn(Optional.of(mockPlant));
         
         // Mock that user has not reported this plant before
         when(plantReportRepository.existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         )).thenReturn(false);

         // Mock save report
         PlantReport savedReport = PlantReport.builder()
                 .reportId(1L)
                 .plant(mockPlant)
                 .reporter(mockUser)
                 .reason(reason)
                 .status(PlantReport.ReportStatus.PENDING)
                 .build();
         when(plantReportRepository.save(any(PlantReport.class))).thenReturn(savedReport);

         // Mock report count >= 3 (existing reports: 3, new report: 1, total: 4)
         when(plantReportRepository.countByPlantId(plantId)).thenReturn(4);

         // Act
         plantService.reportPlant(request, reporterId);

         // Assert
         // Verify that userRepository.findById was called
         verify(userRepository, times(1)).findById(Math.toIntExact(reporterId));
         
         // Verify that plantRepository.findById was called with correct parameter
         verify(plantRepository, times(1)).findById(plantId);
         
         // Verify that plantReportRepository.existsByPlantAndReporterAndStatus was called
         verify(plantReportRepository, times(1)).existsByPlantAndReporterAndStatus(
                 mockPlant, mockUser, PlantReport.ReportStatus.PENDING
         );
         
         // Verify that plantReportRepository.save was called with correct report
         verify(plantReportRepository, times(1)).save(argThat(report -> 
                 report.getPlant().equals(mockPlant) &&
                 report.getReporter().equals(mockUser) &&
                 report.getReason().equals(reason) &&
                 report.getStatus().equals(PlantReport.ReportStatus.PENDING)
         ));
         
         // Verify that plantReportRepository.countByPlantId was called
         verify(plantReportRepository, times(1)).countByPlantId(plantId);
         
         // Verify that plant status was changed to INACTIVE and saved
         verify(plantRepository, times(1)).save(argThat(plant -> 
                 plant.getId().equals(plantId) &&
                 plant.getStatus().equals(Plants.PlantStatus.INACTIVE)
         ));
     }
 }
