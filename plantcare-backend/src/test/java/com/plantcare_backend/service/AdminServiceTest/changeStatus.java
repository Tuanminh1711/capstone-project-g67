package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class changeStatus {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminServiceImpl adminService;

    private Users user;

    private Users.UserStatus requestStatus;

    @BeforeEach
    void setup() {
        user = Users.builder()
                .id(1)
                .status(Users.UserStatus.ACTIVE)
                .build();

        requestStatus = Users.UserStatus.INACTIVE;
    }

    @Test
    void changeStatus_success() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));

            adminService.changeStatus(1, requestStatus);

            assertEquals(requestStatus, user.getStatus(), "Status should be updated");
            System.out.println("Test 'changeStatus_success' thành công");

            verify(userRepository).save(user);
        } catch (Exception e) {
            System.out.println("Test 'changeStatus_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void changeStatus_userNotFound() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                adminService.changeStatus(1, requestStatus);
            });

            assertEquals("User not found", ex.getMessage());
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());

        } catch (Exception e) {
            System.out.println("Test 'changeStatus_userNotFound' thất bại: " + e.getMessage());
        }
    }
}
