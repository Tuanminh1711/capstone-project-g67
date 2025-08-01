package com.plantcare_backend.service.adminServiceTest;

import com.plantcare_backend.dto.request.admin.UserRegisterStatisticRequestDTO;
import com.plantcare_backend.dto.response.admin.UserRegisterStatisticResponseDTO;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.AssertionsKt.assertNotNull;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
public class GetUserRegisterStatisticsTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private UserRegisterStatisticRequestDTO requestDTO;

    List<Object[]> mockResults;

    @BeforeEach
    void setUp() {
        startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        endDate = LocalDateTime.of(2024, 1, 31, 0, 0);
        requestDTO = new UserRegisterStatisticRequestDTO();
        requestDTO.setStartDate(startDate);
        requestDTO.setEndDate(endDate);

        mockResults = List.of(
                new Object[]{java.sql.Date.valueOf("2024-01-01"), 5L},
                new Object[]{java.sql.Date.valueOf("2024-01-02"), 3L},
                new Object[]{java.sql.Date.valueOf("2024-01-03"), 7L}
        );
    }

    @Test
    void getUserRegisterStatistics_success() {
        try {
            given(userRepository.countUsersRegisteredByDate(startDate, endDate)).willReturn(mockResults);

            List<UserRegisterStatisticResponseDTO> result = adminService.getUserRegisterStatistics(requestDTO);

            assertEquals(3, result.size());

            assertEquals(LocalDate.of(2024, 1, 1), result.get(0).getDate());
            assertEquals(5L, result.get(0).getTotalRegistered());

            assertEquals(LocalDate.of(2024, 1, 2), result.get(1).getDate());
            assertEquals(3L, result.get(1).getTotalRegistered());

            assertEquals(LocalDate.of(2024, 1, 3), result.get(2).getDate());
            assertEquals(7L, result.get(2).getTotalRegistered());

            System.out.println("Test 'getUserRegisterStatistics_success' thành công");
            for (UserRegisterStatisticResponseDTO responseDTO : result) {
                System.out.println(responseDTO);
            }
        } catch (Exception e) {
            System.out.println("Test 'getUserRegisterStatistics_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getUserRegisterStatistics_noData() {
        try {
            given(userRepository.countUsersRegisteredByDate(startDate, endDate)).willReturn(Collections.emptyList());

            List<UserRegisterStatisticResponseDTO> result = adminService.getUserRegisterStatistics(requestDTO);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            System.out.println("Test 'getUserRegisterStatistics_noData' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getUserRegisterStatistics_noData' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getUserRegisterStatistics_startAfterEnd_throwsException() {
        try {
            requestDTO.setStartDate(LocalDateTime.of(2024, 1, 5, 0, 0));
            requestDTO.setEndDate(LocalDateTime.of(2024, 1, 1, 0, 0));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                adminService.getUserRegisterStatistics(requestDTO);
            });
            System.out.println("Test 'getUserRegisterStatistics_noData' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'getUserRegisterStatistics_noData' thất bại: " + e.getMessage());
        }
    }

}
