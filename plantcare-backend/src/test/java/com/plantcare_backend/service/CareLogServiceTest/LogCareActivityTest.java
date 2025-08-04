package com.plantcare_backend.service.CareLogServiceTest;

import com.plantcare_backend.dto.request.plantcare.CareCompletionRequest;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.CareLog;
import com.plantcare_backend.model.CareType;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.CareTypeRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.impl.CareLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LogCareActivityTest {

    @InjectMocks
    private CareLogServiceImpl careLogService;

    @Mock
    private UserPlantRepository userPlantRepository;

    @Mock
    private CareLogRepository careLogRepository;

    @Mock
    private CareTypeRepository careTypeRepository;

    @Mock
    private ActivityLogService activityLogService;

    private UserPlants mockUserPlant;
    private CareCompletionRequest mockRequest;

    @BeforeEach
    void setUp() {
        mockUserPlant = UserPlants.builder()
                .userPlantId(1L)
                .userId(100L)
                .plantName("Test Plant")
                .build();

        mockRequest = new CareCompletionRequest();
        mockRequest.setNotes("care note");
        mockRequest.setImageUrl("url.jpg");
    }

    /**
     * UTCID01: Normal test case - plant of user does not exist
     * Condition: userPlantId = 1, note = "care note", imageUrl = "url.jpg"
     * Expected: ResourceNotFoundException with message "User plant not found with ID: ..."
     * Type: Normal (N)
     */
    @Test
    void logCareActivity_UTCID01_PlantNotExists_ThrowsResourceNotFoundException() {
        try {
            // Arrange
            Long userPlantId = 1L;
            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.empty());

            // Act & Assert
            ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
                careLogService.logCareActivity(userPlantId, mockRequest);
            });

            // Verify exception message
            assertTrue(exception.getMessage().contains("User plant not found with id: " + userPlantId));

            // Verify repository methods were not called
            verify(careLogRepository, never()).save(any(CareLog.class));
            verify(activityLogService, never()).logActivity(anyInt(), anyString(), anyString());

            System.out.println("Test 'logCareActivity_UTCID01_PlantNotExists_ThrowsResourceNotFoundException' PASSED");
            System.out.println("Exception: " + exception.getClass().getSimpleName());
            System.out.println("Log message: \"User plant not found with ID: " + userPlantId + "\"");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_UTCID01_PlantNotExists_ThrowsResourceNotFoundException' FAILED: " + e.getMessage());
            fail("Test should throw ResourceNotFoundException: " + e.getMessage());
        }
    }

    /**
     * UTCID02: Normal test case - all valid
     * Condition: userPlantId = 1, note = "care note", imageUrl = "url.jpg"
     * Expected: void return, log message "Logged care activity for user plant: ..."
     * Type: Normal (N)
     */
    @Test
    void logCareActivity_UTCID02_AllValid_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, mockRequest);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_UTCID02_AllValid_Success' PASSED");
            System.out.println("Return: void");
            System.out.println("Log message: \"Logged care activity for user plant: " + userPlantId + "\"");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_UTCID02_AllValid_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID03: Abnormal test case - empty userPlantId
     * Condition: userPlantId = "" (empty string), note = "care note", imageUrl = "url.jpg"
     * Expected: IllegalArgumentException
     * Type: Abnormal (A)
     */
    @Test
    void logCareActivity_UTCID03_EmptyUserPlantId_ThrowsIllegalArgumentException() {
        try {
            // Arrange - Pass null as userPlantId (equivalent to empty)
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes("care note");
            request.setImageUrl("url.jpg");

            // Act & Assert - This should throw IllegalArgumentException for null userPlantId
            assertThrows(IllegalArgumentException.class, () -> {
                careLogService.logCareActivity(null, request);
            });

            // Verify repository methods were not called
            verify(userPlantRepository, never()).findById(any());
            verify(careLogRepository, never()).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_UTCID03_EmptyUserPlantId_ThrowsIllegalArgumentException' PASSED");
            System.out.println("Exception: IllegalArgumentException");
            System.out.println("Log message: \"Fail to log care activity\"");
            System.out.println("Type: Abnormal (A)");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_UTCID03_EmptyUserPlantId_ThrowsIllegalArgumentException' FAILED: " + e.getMessage());
            fail("Test should throw IllegalArgumentException: " + e.getMessage());
        }
    }

    /**
     * UTCID04: Normal test case - empty note
     * Condition: userPlantId = 1, note = "" (empty string), imageUrl = "url.jpg"
     * Expected: void return, log message "Logged care activity for user plant: ..."
     * Type: Normal (N)
     */
    @Test
    void logCareActivity_UTCID04_EmptyNote_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes(""); // Empty note
            request.setImageUrl("url.jpg");

            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, request);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_UTCID04_EmptyNote_Success' PASSED");
            System.out.println("Return: void");
            System.out.println("Log message: \"Logged care activity for user plant: " + userPlantId + "\"");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_UTCID04_EmptyNote_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * UTCID05: Normal test case - empty imageUrl
     * Condition: userPlantId = 1, note = "care note", imageUrl = "" (empty string)
     * Expected: void return, log message "Logged care activity for user plant: ..."
     * Type: Normal (N)
     */
    @Test
    void logCareActivity_UTCID05_EmptyImageUrl_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes("care note");
            request.setImageUrl(""); // Empty imageUrl

            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, request);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_UTCID05_EmptyImageUrl_Success' PASSED");
            System.out.println("Return: void");
            System.out.println("Log message: \"Logged care activity for user plant: " + userPlantId + "\"");
            System.out.println("Type: Normal (N)");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_UTCID05_EmptyImageUrl_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Null request
     * Tests the scenario when request is null
     */
    @Test
    void logCareActivity_NullRequest_ThrowsNullPointerException() {
        try {
            // Arrange
            Long userPlantId = 1L;

            // Act & Assert
            assertThrows(NullPointerException.class, () -> {
                careLogService.logCareActivity(userPlantId, null);
            });

            System.out.println("Test 'logCareActivity_NullRequest_ThrowsNullPointerException' PASSED");
            System.out.println("Exception: NullPointerException");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_NullRequest_ThrowsNullPointerException' FAILED: " + e.getMessage());
            fail("Test should throw NullPointerException: " + e.getMessage());
        }
    }

    /**
     * Additional test case: All null values
     * Tests the scenario when all request fields are null
     */
    @Test
    void logCareActivity_AllNullValues_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes(null);
            request.setImageUrl(null);

            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, request);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_AllNullValues_Success' PASSED");
            System.out.println("Return: void");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_AllNullValues_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Very long note
     * Tests the scenario when note is very long
     */
    @Test
    void logCareActivity_VeryLongNote_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes("This is a very long care note that contains detailed information about the care activity performed on the plant. It includes watering details, fertilization information, pruning notes, and any other relevant care activities that were completed.");
            request.setImageUrl("url.jpg");

            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, request);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_VeryLongNote_Success' PASSED");
            System.out.println("Return: void");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_VeryLongNote_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }

    /**
     * Additional test case: Special characters in note
     * Tests the scenario when note contains special characters
     */
    @Test
    void logCareActivity_SpecialCharactersInNote_Success() {
        try {
            // Arrange
            Long userPlantId = 1L;
            CareCompletionRequest request = new CareCompletionRequest();
            request.setNotes("Care note with special chars: @#$%^&*()_+-=[]{}|;':\",./<>?");
            request.setImageUrl("url.jpg");

            given(userPlantRepository.findById(userPlantId))
                    .willReturn(Optional.of(mockUserPlant));
            given(careLogRepository.save(any(CareLog.class)))
                    .willReturn(new CareLog());

            // Act
            careLogService.logCareActivity(userPlantId, request);

            // Assert - Verify repository methods were called
            verify(userPlantRepository).findById(userPlantId);
            verify(careLogRepository).save(any(CareLog.class));

            System.out.println("Test 'logCareActivity_SpecialCharactersInNote_Success' PASSED");
            System.out.println("Return: void");
        } catch (Exception e) {
            System.out.println("Test 'logCareActivity_SpecialCharactersInNote_Success' FAILED: " + e.getMessage());
            fail("Test should not throw exception: " + e.getMessage());
        }
    }
}
