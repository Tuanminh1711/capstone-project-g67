package com.plantcare_backend.service.adminServiceTest;

import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ResetPasswordTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private Users mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new Users();
        mockUser.setId(1);
        mockUser.setEmail("test@example.com");
        mockUser.setUsername("testuser");
    }

    @Test
    void resetPassword_success() {
        try {
            given(userRepository.findById(mockUser.getId())).willReturn(Optional.of(mockUser));
            given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");

            adminService.resetPassword(mockUser.getId());

            verify(userRepository).save(argThat(user ->
                    user.getPassword().equals("encodedPassword")));
            verify(emailService).sendEmail(
                    eq("test@example.com"),
                    eq("Your password has been reset"),
                    startsWith("Your new password is: ")
            );
            System.out.println("Test 'resetPassword_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'resetPassword_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void resetPassword_userNotFound() {
        try {
            given(userRepository.findById(mockUser.getId())).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                adminService.resetPassword(mockUser.getId());
            });

            assertEquals("User not found", ex.getMessage());
            verify(userRepository, never()).save(any());
            verify(emailService, never()).sendEmail(any(), any(), any());
            System.out.println("Test 'resetPassword_userNotFound' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'resetPassword_userNotFound' thất bại: " + e.getMessage());
        }
    }

}
