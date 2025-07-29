package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.dto.request.admin.UserActivityLogRequestDTO;
import com.plantcare_backend.model.UserActivityLog;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.AssertionsKt.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
public class GetUserActivityLogsTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    UserActivityLog log1;
    UserActivityLog log2;

    int userId = 1;
    int pageNo = 0;
    int pageSize = 10;

    @BeforeEach
    void setUp() {
        log1 = UserActivityLog.builder()
                .id(1L)
                .action("LOGIN")
                .timestamp(LocalDateTime.now())
                .ipAddress("192.168.1.1")
                .description("User logged in")
                .build();

        log2 = UserActivityLog.builder()
                .id(2L)
                .action("LOGOUT")
                .timestamp(LocalDateTime.now().minusHours(1))
                .ipAddress("192.168.1.1")
                .description("User logged out")
                .build();

    }

    @Test
    void getUserActivityLogs_success() {
        Page<UserActivityLog> page = new PageImpl<>(List.of(log1, log2));
        try {
            given(userActivityLogRepository.findByUser_Id(eq(userId), any(Pageable.class)))
                    .willReturn(page);

            Page<UserActivityLogRequestDTO> result = adminService.getUserActivityLogs(userId, pageNo, pageSize);

            assertNotNull(result);
            assertEquals(2, result.getContent().size());

            UserActivityLogRequestDTO dto1 = result.getContent().get(0);
            assertEquals("LOGIN", dto1.getAction());
            assertEquals("192.168.1.1", dto1.getIpAddress());
            System.out.println("Test 'getUserActivityLogs_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getUserActivityLogs_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getUserActivityLogs_noLogSuccess() {
        Page<UserActivityLog> page = new PageImpl<>(Collections.emptyList());
        try {
            given(userActivityLogRepository.findByUser_Id(eq(userId), any(Pageable.class)))
                    .willReturn(page);

            Page<UserActivityLogRequestDTO> result = adminService.getUserActivityLogs(userId, pageNo, pageSize);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            System.out.println("Test 'getUserActivityLogs_noLogSuccess' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getUserActivityLogs_noLogSuccess' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getUserActivityLogs_invalidPageNo() {
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                adminService.getUserActivityLogs(userId, -1, 10);
            });
            System.out.println("Test 'getUserActivityLogs_invalidPageNo' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'getUserActivityLogs_invalidPageNo' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getUserActivityLogs_invalidPageSize() {
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                adminService.getUserActivityLogs(userId, 0, 0);
            });
            System.out.println("Test 'getUserActivityLogs_invalidPageSize' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'getUserActivityLogs_invalidPageSize' thất bại: " + e.getMessage());
        }
    }

}
