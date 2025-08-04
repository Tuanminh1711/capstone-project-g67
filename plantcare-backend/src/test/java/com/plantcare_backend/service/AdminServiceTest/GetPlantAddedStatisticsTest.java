package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.dto.request.admin.PlantAddedStatisticRequestDTO;
import com.plantcare_backend.dto.response.admin.PlantAddedStatisticResponseDTO;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GetPlantAddedStatisticsTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private PlantRepository plantRepository;

    private PlantAddedStatisticRequestDTO requestDTO;
    private List<Object[]> mockResults;

    @BeforeEach
    void setUp() {
        requestDTO = new PlantAddedStatisticRequestDTO();
        mockResults = List.of(
                new Object[]{java.sql.Date.valueOf("2025-01-03"), 5L},
                new Object[]{java.sql.Date.valueOf("2025-01-04"), 3L},
                new Object[]{java.sql.Date.valueOf("2025-01-05"), 7L}
        );
    }

    /**
     * UTCID01: Normal test case
     * Condition: startDate = 03-01-2025, endDate = 05-01-2025
     * Expected: Return List<PlantAddedStatisticResponseDTO> with LocalDate date and long totalAdded
     * Type: Normal (N)
     */
    @Test
    void getPlantAddedStatistics_UTCID01_NormalCase_Success() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 5, 0, 0);
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            given(plantRepository.countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            )).willReturn(mockResults);

            // Act
            List<PlantAddedStatisticResponseDTO> result = adminService.getPlantAddedStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertEquals(3, result.size());

            // Verify first result
            assertEquals(LocalDate.of(2025, 1, 3), result.get(0).getDate());
            assertEquals(5L, result.get(0).getTotalAdded());

            // Verify second result
            assertEquals(LocalDate.of(2025, 1, 4), result.get(1).getDate());
            assertEquals(3L, result.get(1).getTotalAdded());

            // Verify third result
            assertEquals(LocalDate.of(2025, 1, 5), result.get(2).getDate());
            assertEquals(7L, result.get(2).getTotalAdded());

            // Verify repository method was called with correct parameters
            verify(plantRepository).countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            );

            System.out.println("Test 'getPlantAddedStatistics_UTCID01_NormalCase_Success' PASSED");
            System.out.println("Return: List<PlantAddedStatisticResponseDTO> with LocalDate date and long totalAdded");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_UTCID01_NormalCase_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID02: Abnormal test case - endDate before startDate
     * Condition: startDate = 03-01-2025, endDate = 01-01-2025
     * Expected: Method executes normally but returns empty result due to invalid date range
     * Type: Abnormal (A)
     */
    @Test
    void getPlantAddedStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 1, 0, 0); // endDate before startDate
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            // Mock repository to return empty result for invalid date range
            given(plantRepository.countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            )).willReturn(new ArrayList<Object[]>());

            // Act
            List<PlantAddedStatisticResponseDTO> result = adminService.getPlantAddedStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository method was called (method doesn't validate date range)
            verify(plantRepository).countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            );

            System.out.println("Test 'getPlantAddedStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult' PASSED");
            System.out.println("Return: Empty List<PlantAddedStatisticResponseDTO>");
            System.out.println("Type: Abnormal (A) - Method accepts invalid date range");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID03: Abnormal test case - invalid startDate
     * Condition: startDate = 30-02-2025 (invalid date), endDate = 05-02-2025
     * Expected: DateTimeException when creating invalid date
     * Type: Abnormal (A)
     */
    @Test
    void getPlantAddedStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException() {
        try {
            // Arrange - Create invalid date (February 30th doesn't exist)
            LocalDateTime invalidStartDate = LocalDateTime.of(2025, 2, 30, 0, 0); // Invalid date
            LocalDateTime endDate = LocalDateTime.of(2025, 2, 5, 0, 0);
            requestDTO.setStartDate(invalidStartDate);
            requestDTO.setEndDate(endDate);

            // Act & Assert - This should throw DateTimeException when creating invalid date
            assertThrows(java.time.DateTimeException.class, () -> {
                adminService.getPlantAddedStatistics(requestDTO);
            });

            System.out.println("Test 'getPlantAddedStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException' PASSED");
            System.out.println("Exception: DateTimeException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException' FAILED: " + e.getMessage());
            fail("Test should throw DateTimeException: " + e.getMessage());
        }
    }

    /**
     * UTCID04: Abnormal test case - invalid startDate with unspecified endDate
     * Condition: startDate = 30-02-2025 (invalid date), endDate = ** (unspecified)
     * Expected: DateTimeException when creating invalid date
     * Type: Abnormal (A)
     */
    @Test
    void getPlantAddedStatistics_UTCID04_InvalidStartDateWithUnspecifiedEndDate_ThrowsDateTimeException() {
        try {
            // Arrange - Create invalid date with null endDate
            LocalDateTime invalidStartDate = LocalDateTime.of(2025, 2, 30, 0, 0); // Invalid date
            requestDTO.setStartDate(invalidStartDate);
            requestDTO.setEndDate(null); // Unspecified endDate

            // Act & Assert - This should throw DateTimeException when creating invalid date
            assertThrows(java.time.DateTimeException.class, () -> {
                adminService.getPlantAddedStatistics(requestDTO);
            });

            System.out.println("Test 'getPlantAddedStatistics_UTCID04_InvalidStartDateWithUnspecifiedEndDate_ThrowsDateTimeException' PASSED");
            System.out.println("Exception: DateTimeException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_UTCID04_InvalidStartDateWithUnspecifiedEndDate_ThrowsDateTimeException' FAILED: " + e.getMessage());
            fail("Test should throw DateTimeException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Empty result from repository
     * Tests the scenario when no plants were added in the specified date range
     */
    @Test
    void getPlantAddedStatistics_EmptyResult_Success() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 5, 0, 0);
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            given(plantRepository.countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            )).willReturn(new ArrayList<Object[]>());

            // Act
            List<PlantAddedStatisticResponseDTO> result = adminService.getPlantAddedStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository method was called
            verify(plantRepository).countPlantsAddedByDate(
                    Timestamp.valueOf(startDate),
                    Timestamp.valueOf(endDate)
            );

            System.out.println("Test 'getPlantAddedStatistics_EmptyResult_Success' PASSED");
            System.out.println("Return: Empty List<PlantAddedStatisticResponseDTO>");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_EmptyResult_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Null request DTO
     * Tests the scenario when requestDTO is null
     */
    @Test
    void getPlantAddedStatistics_NullRequestDTO_ThrowsNullPointerException() {
        try {
            // Act & Assert
            NullPointerException exception = assertThrows(NullPointerException.class, () -> {
                adminService.getPlantAddedStatistics(null);
            });

            System.out.println("Test 'getPlantAddedStatistics_NullRequestDTO_ThrowsNullPointerException' PASSED");
            System.out.println("Exception: " + exception.getClass().getSimpleName());
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_NullRequestDTO_ThrowsNullPointerException' FAILED: " + e.getMessage());
            fail("Test should throw NullPointerException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Same start and end date
     * Tests the boundary case when startDate equals endDate
     */
    @Test
    void getPlantAddedStatistics_SameStartAndEndDate_Success() {
        try {
            // Arrange
            LocalDateTime sameDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            requestDTO.setStartDate(sameDate);
            requestDTO.setEndDate(sameDate);

            List<Object[]> singleDayResult = new ArrayList<>();
            singleDayResult.add(new Object[]{java.sql.Date.valueOf("2025-01-03"), 2L});
            given(plantRepository.countPlantsAddedByDate(
                    Timestamp.valueOf(sameDate),
                    Timestamp.valueOf(sameDate)
            )).willReturn(singleDayResult);

            // Act
            List<PlantAddedStatisticResponseDTO> result = adminService.getPlantAddedStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(LocalDate.of(2025, 1, 3), result.get(0).getDate());
            assertEquals(2L, result.get(0).getTotalAdded());

            // Verify repository method was called
            verify(plantRepository).countPlantsAddedByDate(
                    Timestamp.valueOf(sameDate),
                    Timestamp.valueOf(sameDate)
            );

            System.out.println("Test 'getPlantAddedStatistics_SameStartAndEndDate_Success' PASSED");
            System.out.println("Return: List<PlantAddedStatisticResponseDTO> with single day data");
        } catch (Exception e) {
            System.out.println("Test 'getPlantAddedStatistics_SameStartAndEndDate_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }
}
