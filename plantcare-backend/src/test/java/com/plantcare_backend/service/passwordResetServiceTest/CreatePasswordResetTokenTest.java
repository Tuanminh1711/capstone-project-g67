package com.plantcare_backend.service.passwordResetServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CreatePasswordResetTokenTest {
    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        Cache<String, String> mockCache = Caffeine.newBuilder()
                .maximumSize(100)
                .build();

        // Inject mock cache vào PasswordResetServiceImpl
        ReflectionTestUtils.setField(passwordResetService, "resetPasswordCache", mockCache);
    }

    @Test
    void createPasswordResetToken_success() {
        try {
            String email = "test@example.com";

            given(userRepository.existsByEmail(email)).willReturn(true);
            doNothing().when(emailService).sendResetCodeEmail(anyString(), anyString());

            passwordResetService.createPasswordResetToken(email);

            verify(userRepository).existsByEmail(email);
            verify(emailService).sendResetCodeEmail(eq(email), anyString());

            System.out.println("Test 'createPasswordResetToken_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'createPasswordResetToken_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPasswordResetToken_emailNotFound() {
        try {
            String email = "notfound@example.com";

            given(userRepository.existsByEmail(email)).willReturn(false);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                passwordResetService.createPasswordResetToken(email);
            });

            assertEquals("Email not found in system", ex.getMessage());

            System.out.println("Test 'createPasswordResetToken_emailNotFound' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'createPasswordResetToken_emailNotFound' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPasswordResetToken_emailSendingFails() {
        try {
            String email = "test@example.com";

            given(userRepository.existsByEmail(email)).willReturn(true);
            doThrow(new RuntimeException("Mail server error"))
                    .when(emailService).sendResetCodeEmail(eq(email), anyString());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                passwordResetService.createPasswordResetToken(email);
            });

            assertEquals("Failed to send reset code: Mail server error", ex.getMessage());

            System.out.println("Test 'createPasswordResetToken_emailSendingFails' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'createPasswordResetToken_emailSendingFails' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPasswordResetToken_blankEmail() {
        try {
            String email = "";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                passwordResetService.createPasswordResetToken(email);
            });

            assertEquals("Email can not be null", ex.getMessage());

            System.out.println("Test 'createPasswordResetToken_blankEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'createPasswordResetToken_blankEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void createPasswordResetToken_invalidEmailFormat() {
        try {
            String email = "invalid-email";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                passwordResetService.createPasswordResetToken(email);
            });

            assertEquals("Email is invalid" + email, ex.getMessage());

            System.out.println("Test 'createPasswordResetToken_invalidEmailFormat' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'createPasswordResetToken_invalidEmailFormat' thất bại: " + e.getMessage());
        }
    }
}
