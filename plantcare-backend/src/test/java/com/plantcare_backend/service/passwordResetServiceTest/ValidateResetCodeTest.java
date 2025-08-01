package com.plantcare_backend.service.passwordResetServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.plantcare_backend.dto.request.auth.ResetPasswordRequestDTO;
import com.plantcare_backend.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ValidateResetCodeTest {

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    ResetPasswordRequestDTO dto;

    private Cache<String, ResetPasswordRequestDTO> resetPasswordCache;

    String email = "user@gmail.com";
    String code = "123456";

    @BeforeEach
    void setUp() {
        resetPasswordCache = Caffeine.newBuilder()
                .maximumSize(1000)
                .build();

        dto = new ResetPasswordRequestDTO(
                email,
                code,
                LocalDateTime.now().plusMinutes(15),
                false
        );
        ReflectionTestUtils.setField(passwordResetService, "resetPasswordCache", resetPasswordCache);
    }

    @Test
    void validateResetCode_success() {
        try {
            resetPasswordCache.put(email, dto);

            boolean result = passwordResetService.validateResetCode(email, code);

            assertTrue(result);
            System.out.println("Test 'validateResetCode_success' thành công");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_dataNull() {
        try {
            boolean result = passwordResetService.validateResetCode(email, code);

            assertFalse(result);
            System.out.println("Test 'validateResetCode_dataNull' thành công");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_dataNull' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_codeUsed() {
        try {
            ResetPasswordRequestDTO dto = new ResetPasswordRequestDTO(
                    email,
                    code,
                    LocalDateTime.now().plusMinutes(10),
                    true
            );
            resetPasswordCache.put(email, dto);

            boolean result = passwordResetService.validateResetCode(email, code);

            assertFalse(result);
            System.out.println("Test 'validateResetCode_codeUsed' thành công");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_codeUsed' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_codeExpired() {
        try {
            dto = new ResetPasswordRequestDTO(
                    email,
                    code,
                    LocalDateTime.now().minusMinutes(1),
                    false
            );
            resetPasswordCache.put(email, dto);

            boolean result = passwordResetService.validateResetCode(email, code);

            assertFalse(result);
            System.out.println("Test 'validateResetCode_codeExpired' thành công");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_codeExpired' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_codeNotMatch() {
        try {
            String wrongCode = "000000";

            resetPasswordCache.put(email, dto);

            boolean result = passwordResetService.validateResetCode(email, wrongCode);

            assertFalse(result);
            System.out.println("Test 'validateResetCode_codeNotMatch' thành công");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_codeNotMatch' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_invalidEmail() {
        try {
            email = "inalid-email";

            resetPasswordCache.put(email, dto);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                passwordResetService.validateResetCode(email, code);
            });

            assertEquals("Invalid email address: " + email, ex.getMessage());
            System.out.println("Test 'validateResetCode_invalidEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_invalidEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void validateResetCode_nullEmail() {
        try {
            email = "";

            resetPasswordCache.put(email, dto);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                passwordResetService.validateResetCode(email, code);
            });

            assertEquals("Invalid email address: " + email, ex.getMessage());
            System.out.println("Test 'validateResetCode_nullEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'validateResetCode_nullEmail' thất bại: " + e.getMessage());
        }
    }
}
