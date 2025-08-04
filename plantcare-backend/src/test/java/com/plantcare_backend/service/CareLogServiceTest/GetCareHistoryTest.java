package com.plantcare_backend.service.CareLogServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.CareLog;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.CareLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GetCareHistoryTest {

    @InjectMocks
    private CareLogServiceImpl careLogService;

    @Mock
    private UserPlantRepository userPlantRepository;

    @Mock
    private CareLogRepository careLogRepository;

    private UserPlants mockUserPlant;
    private List<CareLog> mockCareLogs;
    private Page<CareLog> mockPage;

    @BeforeEach
    void setUp() {
        mockUserPlant = UserPlants.builder()
                .userPlantId(1L)
                .userId(100L)
                .plantName("Test Plant")
                .build();

        mockCareLogs = new ArrayList<>();
        mockCareLogs.add(CareLog.builder()
                .logId(1L)
                .userPlant(mockUserPlant)
                .notes("Care note 1")
                .imageUrl("image1.jpg")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build());
        mockCareLogs.add(CareLog.builder()
                .logId(2L)
                .userPlant(mockUserPlant)
                .notes("Care note 2")
                .imageUrl("image2.jpg")
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build());
    }

    /**
     * UTCID01: Normal test case - plant of user does not exist
     * Condition: userPlantId = 1, pageNo = 0, pageSize = 10
     * Expected: ResourceNotFoundException with message "User plant not found with id: ..."
     * Type: Normal (N)
     */
    @Test
    void getCareHistory_UTCID01_PlantNotExists_ThrowsResourceNotFoundException() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = 10;

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(false);

            // Act & Assert
            ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            // Verify exception message
            assertTrue(exception.getMessage().contains("User plant not found with id: " + userPlantId));

            // Verify repository methods were not called
            verify(careLogRepository, never()).findByUserPlant_UserPlantId(any(), any());

            System.out.println("Test 'getCareHistory_UTCID01_PlantNotExists_ThrowsResourceNotFoundException' PASSED");
            System.out.println("Exception: " + exception.getClass().getSimpleName());
            System.out.println("Log message: \"User plant not found with ID: " + userPlantId + "\"");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID01_PlantNotExists_ThrowsResourceNotFoundException' FAILED: " + e.getMessage());
            fail("Test should throw ResourceNotFoundException: " + e.getMessage());
        }
    }

    /**
     * UTCID02: Normal test case - no care history in DB
     * Condition: userPlantId = 1, pageNo = 0, pageSize = 10
     * Expected: Empty page
     * Type: Normal (N)
     */
    @Test
    void getCareHistory_UTCID02_NoCareHistory_ReturnsEmptyPage() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = 10;

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Create empty page
            Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<CareLog> emptyPage = new PageImpl<>(new ArrayList<>(), pageable, 0);

            given(careLogRepository.findByUserPlant_UserPlantId(userPlantId, pageable))
                    .willReturn(emptyPage);

            // Act
            Page<?> result = careLogService.getCareHistory(userPlantId, pageNo, pageSize);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
            assertEquals(0, result.getTotalElements());

            // Verify repository methods were called
            verify(userPlantRepository).existsById(userPlantId);
            verify(careLogRepository).findByUserPlant_UserPlantId(userPlantId, pageable);

            System.out.println("Test 'getCareHistory_UTCID02_NoCareHistory_ReturnsEmptyPage' PASSED");
            System.out.println("Return: Empty page");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID02_NoCareHistory_ReturnsEmptyPage' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID03: Normal test case - all valid
     * Condition: userPlantId = 1, pageNo = 0, pageSize = 10
     * Expected: Page of care history
     * Type: Normal (N)
     */
    @Test
    void getCareHistory_UTCID03_AllValid_ReturnsPageOfCareHistory() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = 10;

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Create page with care logs
            Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<CareLog> careLogPage = new PageImpl<>(mockCareLogs, pageable, mockCareLogs.size());

            given(careLogRepository.findByUserPlant_UserPlantId(userPlantId, pageable))
                    .willReturn(careLogPage);

            // Act
            Page<?> result = careLogService.getCareHistory(userPlantId, pageNo, pageSize);

            // Assert
            assertNotNull(result);
            assertFalse(result.isEmpty());
            assertEquals(mockCareLogs.size(), result.getTotalElements());

            // Verify repository methods were called
            verify(userPlantRepository).existsById(userPlantId);
            verify(careLogRepository).findByUserPlant_UserPlantId(userPlantId, pageable);

            System.out.println("Test 'getCareHistory_UTCID03_AllValid_ReturnsPageOfCareHistory' PASSED");
            System.out.println("Return: Page of care history");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID03_AllValid_ReturnsPageOfCareHistory' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID04: Abnormal test case - negative page number
     * Condition: userPlantId = 1, pageNo = -1, pageSize = 10
     * Expected: IllegalArgumentException
     * Type: Abnormal (A)
     */
    @Test
    void getCareHistory_UTCID04_NegativePageNumber_ThrowsIllegalArgumentException() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = -1; // Negative page number
            int pageSize = 10;

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Act & Assert - This should throw IllegalArgumentException for negative page number
            assertThrows(IllegalArgumentException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            // Verify repository methods were not called
            verify(careLogRepository, never()).findByUserPlant_UserPlantId(any(), any());

            System.out.println("Test 'getCareHistory_UTCID04_NegativePageNumber_ThrowsIllegalArgumentException' PASSED");
            System.out.println("Exception: IllegalArgumentException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID04_NegativePageNumber_ThrowsIllegalArgumentException' FAILED: " + e.getMessage());
            fail("Test should throw IllegalArgumentException: " + e.getMessage());
        }
    }

    /**
     * UTCID05: Abnormal test case - empty userPlantId and zero pageSize
     * Condition: userPlantId = null (empty), pageNo = 0, pageSize = 0
     * Expected: IllegalArgumentException
     * Type: Abnormal (A)
     */
    @Test
    void getCareHistory_UTCID05_EmptyUserPlantIdAndZeroPageSize_ThrowsIllegalArgumentException() {
        try {
            // Arrange
            Long userPlantId = null; // Empty userPlantId
            int pageNo = 0;
            int pageSize = 0; // Zero pageSize

            // Act & Assert - This should throw IllegalArgumentException for null userPlantId
            assertThrows(IllegalArgumentException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            // Verify repository methods were not called
            verify(userPlantRepository, never()).existsById(any());
            verify(careLogRepository, never()).findByUserPlant_UserPlantId(any(), any());

            System.out.println("Test 'getCareHistory_UTCID05_EmptyUserPlantIdAndZeroPageSize_ThrowsIllegalArgumentException' PASSED");
            System.out.println("Exception: IllegalArgumentException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID05_EmptyUserPlantIdAndZeroPageSize_ThrowsIllegalArgumentException' FAILED: " + e.getMessage());
            fail("Test should throw IllegalArgumentException: " + e.getMessage());
        }
    }

    /**
     * UTCID06: Abnormal test case - negative pageSize
     * Condition: pageNo = 0, pageSize = -5
     * Expected: IllegalArgumentException
     * Type: Abnormal (A)
     */
    @Test
    void getCareHistory_UTCID06_NegativePageSize_ThrowsIllegalArgumentException() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = -5; // Negative pageSize

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Act & Assert - This should throw IllegalArgumentException for negative pageSize
            assertThrows(IllegalArgumentException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            // Verify repository methods were not called
            verify(careLogRepository, never()).findByUserPlant_UserPlantId(any(), any());

            System.out.println("Test 'getCareHistory_UTCID06_NegativePageSize_ThrowsIllegalArgumentException' PASSED");
            System.out.println("Exception: IllegalArgumentException");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID06_NegativePageSize_ThrowsIllegalArgumentException' FAILED: " + e.getMessage());
            fail("Test should throw IllegalArgumentException: " + e.getMessage());
        }
    }

    /**
     * UTCID07: Boundary test case - large pageSize
     * Condition: pageNo = 0, pageSize = 10000
     * Expected: Page of care history
     * Type: Boundary (B)
     */
    @Test
    void getCareHistory_UTCID07_LargePageSize_ReturnsPageOfCareHistory() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = 10000; // Large pageSize

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Create page with care logs
            Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<CareLog> careLogPage = new PageImpl<>(mockCareLogs, pageable, mockCareLogs.size());

            given(careLogRepository.findByUserPlant_UserPlantId(userPlantId, pageable))
                    .willReturn(careLogPage);

            // Act
            Page<?> result = careLogService.getCareHistory(userPlantId, pageNo, pageSize);

            // Assert
            assertNotNull(result);
            assertFalse(result.isEmpty());
            assertEquals(mockCareLogs.size(), result.getTotalElements());

            // Verify repository methods were called
            verify(userPlantRepository).existsById(userPlantId);
            verify(careLogRepository).findByUserPlant_UserPlantId(userPlantId, pageable);

            System.out.println("Test 'getCareHistory_UTCID07_LargePageSize_ReturnsPageOfCareHistory' PASSED");
            System.out.println("Return: Page of care history");
            System.out.println("Type: Boundary (B)");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_UTCID07_LargePageSize_ReturnsPageOfCareHistory' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Null userPlantId
     * Tests the scenario when userPlantId is null
     */
    @Test
    void getCareHistory_NullUserPlantId_ThrowsNullPointerException() {
        try {
            // Arrange
            Long userPlantId = null;
            int pageNo = 0;
            int pageSize = 10;

            // Act & Assert
            assertThrows(NullPointerException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            System.out.println("Test 'getCareHistory_NullUserPlantId_ThrowsNullPointerException' PASSED");
            System.out.println("Exception: NullPointerException");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_NullUserPlantId_ThrowsNullPointerException' FAILED: " + e.getMessage());
            fail("Test should throw NullPointerException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Zero pageSize
     * Tests the scenario when pageSize is zero
     */
    @Test
    void getCareHistory_ZeroPageSize_ThrowsIllegalArgumentException() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 0;
            int pageSize = 0; // Zero pageSize

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> {
                careLogService.getCareHistory(userPlantId, pageNo, pageSize);
            });

            System.out.println("Test 'getCareHistory_ZeroPageSize_ThrowsIllegalArgumentException' PASSED");
            System.out.println("Exception: IllegalArgumentException");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_ZeroPageSize_ThrowsIllegalArgumentException' FAILED: " + e.getMessage());
            fail("Test should throw IllegalArgumentException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Large page number
     * Tests the scenario when page number is very large
     */
    @Test
    void getCareHistory_LargePageNumber_ReturnsEmptyPage() {
        try {
            // Arrange
            Long userPlantId = 1L;
            int pageNo = 999999; // Very large page number
            int pageSize = 10;

            given(userPlantRepository.existsById(userPlantId))
                    .willReturn(true);

            // Create empty page for large page number
            Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<CareLog> emptyPage = new PageImpl<>(new ArrayList<>(), pageable, 0);

            given(careLogRepository.findByUserPlant_UserPlantId(userPlantId, pageable))
                    .willReturn(emptyPage);

            // Act
            Page<?> result = careLogService.getCareHistory(userPlantId, pageNo, pageSize);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());

            // Verify repository methods were called
            verify(userPlantRepository).existsById(userPlantId);
            verify(careLogRepository).findByUserPlant_UserPlantId(userPlantId, pageable);

            System.out.println("Test 'getCareHistory_LargePageNumber_ReturnsEmptyPage' PASSED");
            System.out.println("Return: Empty page");
        } catch (Exception e) {
            System.out.println("Test 'getCareHistory_LargePageNumber_ReturnsEmptyPage' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }
}
