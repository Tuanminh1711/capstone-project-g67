package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.dto.request.admin.UserBrowseStatisticRequestDTO;
import com.plantcare_backend.dto.response.admin.UserBrowseStatisticResponseDTO;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GetUserBrowseStatisticsTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    private UserBrowseStatisticRequestDTO requestDTO;
    private List<Object[]> mockResults;

    @BeforeEach
    void setUp() {
        requestDTO = new UserBrowseStatisticRequestDTO();
        mockResults = List.of(
                new Object[]{java.sql.Date.valueOf("2025-01-03"), 10L},
                new Object[]{java.sql.Date.valueOf("2025-01-04"), 15L},
                new Object[]{java.sql.Date.valueOf("2025-01-05"), 8L}
        );
    }

    /**
     * UTCID01: Normal test case
     * Condition: startDate = 03-01-2025, endDate = 05-01-2025
     * Expected: Return List<UserBrowseStatisticResponseDTO> with LocalDate date and long totalActiveUsers
     * Type: Normal (N)
     */
    @Test
    void getUserBrowseStatistics_UTCID01_NormalCase_Success() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 5, 0, 0);
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            given(userActivityLogRepository.countActiveUsersByDate(startDate, endDate))
                    .willReturn(mockResults);

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertEquals(3, result.size());

            // Verify first result
            assertEquals(LocalDate.of(2025, 1, 3), result.get(0).getDate());
            assertEquals(10L, result.get(0).getTotalActiveUsers());

            // Verify second result
            assertEquals(LocalDate.of(2025, 1, 4), result.get(1).getDate());
            assertEquals(15L, result.get(1).getTotalActiveUsers());

            // Verify third result
            assertEquals(LocalDate.of(2025, 1, 5), result.get(2).getDate());
            assertEquals(8L, result.get(2).getTotalActiveUsers());

            // Verify repository method was called with correct parameters
            verify(userActivityLogRepository).countActiveUsersByDate(startDate, endDate);

            System.out.println("Test 'getUserBrowseStatistics_UTCID01_NormalCase_Success' PASSED");
            System.out.println("Return: List<UserBrowseStatisticResponseDTO> with LocalDate date and long totalActiveUsers");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_UTCID01_NormalCase_Success' FAILED: " + e.getMessage());
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
    void getUserBrowseStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 1, 0, 0); // endDate before startDate
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            // Mock repository to return empty result for invalid date range
            given(userActivityLogRepository.countActiveUsersByDate(startDate, endDate))
                    .willReturn(new ArrayList<Object[]>());

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository method was called (method doesn't validate date range)
            verify(userActivityLogRepository).countActiveUsersByDate(startDate, endDate);

            System.out.println("Test 'getUserBrowseStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult' PASSED");
            System.out.println("Return: Empty List<UserBrowseStatisticResponseDTO>");
            System.out.println("Type: Abnormal (A) - Method accepts invalid date range");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_UTCID02_EndDateBeforeStartDate_ReturnsEmptyResult' FAILED: " + e.getMessage());
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
    void getUserBrowseStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException() {
        try {
            // Arrange - Create invalid date (February 30th doesn't exist)
            LocalDateTime invalidStartDate = LocalDateTime.of(2025, 2, 30, 0, 0); // Invalid date
            LocalDateTime endDate = LocalDateTime.of(2025, 2, 5, 0, 0);
            requestDTO.setStartDate(invalidStartDate);
            requestDTO.setEndDate(endDate);

            // Act & Assert - This should throw DateTimeException when creating invalid date
            assertThrows(java.time.DateTimeException.class, () -> {
                adminService.getUserBrowseStatistics(requestDTO);
            });

            System.out.println("Test 'getUserBrowseStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException' PASSED");
            System.out.println("Exception: DateTimeException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_UTCID03_InvalidStartDate_ThrowsDateTimeException' FAILED: " + e.getMessage());
            fail("Test should throw DateTimeException: " + e.getMessage());
        }
    }

    /**
     * UTCID04: Abnormal test case - unspecified dates
     * Condition: startDate = ** (unspecified), endDate = ** (unspecified)
     * Expected: Method executes normally but returns empty result due to null dates
     * Type: Abnormal (A)
     */
    @Test
    void getUserBrowseStatistics_UTCID04_UnspecifiedDates_ReturnsEmptyResult() {
        try {
            // Arrange - Set null dates (unspecified)
            requestDTO.setStartDate(null);
            requestDTO.setEndDate(null);

            // Mock repository to return empty result for null dates
            given(userActivityLogRepository.countActiveUsersByDate(null, null))
                    .willReturn(new ArrayList<Object[]>());

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository method was called (method doesn't validate null dates)
            verify(userActivityLogRepository).countActiveUsersByDate(null, null);

            System.out.println("Test 'getUserBrowseStatistics_UTCID04_UnspecifiedDates_ReturnsEmptyResult' PASSED");
            System.out.println("Return: Empty List<UserBrowseStatisticResponseDTO>");
            System.out.println("Type: Abnormal (A) - Method accepts null dates");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_UTCID04_UnspecifiedDates_ReturnsEmptyResult' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Empty result from repository
     * Tests the scenario when no active users in the specified date range
     */
    @Test
    void getUserBrowseStatistics_EmptyResult_Success() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 5, 0, 0);
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            given(userActivityLogRepository.countActiveUsersByDate(startDate, endDate))
                    .willReturn(new ArrayList<Object[]>());

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository method was called
            verify(userActivityLogRepository).countActiveUsersByDate(startDate, endDate);

            System.out.println("Test 'getUserBrowseStatistics_EmptyResult_Success' PASSED");
            System.out.println("Return: Empty List<UserBrowseStatisticResponseDTO>");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_EmptyResult_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Null request DTO
     * Tests the scenario when requestDTO is null
     */
    @Test
    void getUserBrowseStatistics_NullRequestDTO_ThrowsNullPointerException() {
        try {
            // Act & Assert
            NullPointerException exception = assertThrows(NullPointerException.class, () -> {
                adminService.getUserBrowseStatistics(null);
            });

            System.out.println("Test 'getUserBrowseStatistics_NullRequestDTO_ThrowsNullPointerException' PASSED");
            System.out.println("Exception: " + exception.getClass().getSimpleName());
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_NullRequestDTO_ThrowsNullPointerException' FAILED: " + e.getMessage());
            fail("Test should throw NullPointerException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Same start and end date
     * Tests the boundary case when startDate equals endDate
     */
    @Test
    void getUserBrowseStatistics_SameStartAndEndDate_Success() {
        try {
            // Arrange
            LocalDateTime sameDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            requestDTO.setStartDate(sameDate);
            requestDTO.setEndDate(sameDate);

            List<Object[]> singleDayResult = new ArrayList<>();
            singleDayResult.add(new Object[]{java.sql.Date.valueOf("2025-01-03"), 25L});

            given(userActivityLogRepository.countActiveUsersByDate(sameDate, sameDate))
                    .willReturn(singleDayResult);

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(LocalDate.of(2025, 1, 3), result.get(0).getDate());
            assertEquals(25L, result.get(0).getTotalActiveUsers());

            // Verify repository method was called
            verify(userActivityLogRepository).countActiveUsersByDate(sameDate, sameDate);

            System.out.println("Test 'getUserBrowseStatistics_SameStartAndEndDate_Success' PASSED");
            System.out.println("Return: List<UserBrowseStatisticResponseDTO> with single day data");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_SameStartAndEndDate_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Mixed data types from repository
     * Tests handling of different data types in Object[] from repository
     */
    @Test
    void getUserBrowseStatistics_MixedDataTypes_Success() {
        try {
            // Arrange
            LocalDateTime startDate = LocalDateTime.of(2025, 1, 3, 0, 0);
            LocalDateTime endDate = LocalDateTime.of(2025, 1, 5, 0, 0);
            requestDTO.setStartDate(startDate);
            requestDTO.setEndDate(endDate);

            // Mock repository with mixed data types
            List<Object[]> mixedResults = List.of(
                    new Object[]{LocalDate.of(2025, 1, 3), 10L}, // LocalDate instead of java.sql.Date
                    new Object[]{java.sql.Date.valueOf("2025-01-04"), 15L}, // java.sql.Date
                    new Object[]{LocalDate.of(2025, 1, 5), 8L} // LocalDate
            );

            given(userActivityLogRepository.countActiveUsersByDate(startDate, endDate))
                    .willReturn(mixedResults);

            // Act
            List<UserBrowseStatisticResponseDTO> result = adminService.getUserBrowseStatistics(requestDTO);

            // Assert
            assertNotNull(result);
            assertEquals(3, result.size());

            // Verify all results are properly converted
            assertEquals(LocalDate.of(2025, 1, 3), result.get(0).getDate());
            assertEquals(10L, result.get(0).getTotalActiveUsers());

            assertEquals(LocalDate.of(2025, 1, 4), result.get(1).getDate());
            assertEquals(15L, result.get(1).getTotalActiveUsers());

            assertEquals(LocalDate.of(2025, 1, 5), result.get(2).getDate());
            assertEquals(8L, result.get(2).getTotalActiveUsers());

            // Verify repository method was called
            verify(userActivityLogRepository).countActiveUsersByDate(startDate, endDate);

            System.out.println("Test 'getUserBrowseStatistics_MixedDataTypes_Success' PASSED");
            System.out.println("Return: List<UserBrowseStatisticResponseDTO> with mixed data types");
        } catch (Exception e) {
            System.out.println("Test 'getUserBrowseStatistics_MixedDataTypes_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }
}
