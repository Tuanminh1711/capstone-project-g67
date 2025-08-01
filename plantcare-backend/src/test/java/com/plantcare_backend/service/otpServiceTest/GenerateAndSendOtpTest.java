package com.plantcare_backend.service.otpServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenerateAndSendOtpTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpServiceImpl otpService;

    private Cache<String, OtpServiceImpl.OtpData> caffeineCache;

    private final String email = "test@example.com";
    private final String type = "REGISTER";

    @BeforeEach
    void setUp() {
        caffeineCache = Caffeine.newBuilder()
                .maximumSize(100)
                .build();

        ReflectionTestUtils.setField(otpService, "otpCache", caffeineCache);
        ReflectionTestUtils.setField(otpService, "emailService", emailService);

    }

    @Test
    void testGenerateAndSendOtp_success() {
        try {
            otpService.generateAndSendOtp(email, type);

            OtpServiceImpl.OtpData storedOtp = caffeineCache.getIfPresent(email);
            assertNotNull(storedOtp, "OTP không được lưu vào cache");
            assertEquals(email, storedOtp.getEmail());
            assertEquals(type, storedOtp.getType());
            assertFalse(storedOtp.isUsed());
            assertTrue(storedOtp.getExpiredAt().isAfter(LocalDateTime.now()));

            verify(emailService, times(1)).sendEmailAsync(
                    eq(email),
                    eq("Mã xác thực tài khoản"),
                    startsWith("Mã OTP của bạn là: ")
            );

            System.out.println("Test 'testGenerateAndSendOtp_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGenerateAndSendOtp_overwriteExistingOtp() {
        try {
            String email = "user@example.com";
            String type = "RESET";

            otpService.generateAndSendOtp(email, type);
            OtpServiceImpl.OtpData firstOtp = caffeineCache.getIfPresent(email);

            otpService.generateAndSendOtp(email, type);
            OtpServiceImpl.OtpData secondOtp = caffeineCache.getIfPresent(email);

            assertNotNull(secondOtp);
            assertNotEquals(firstOtp.getOtp(), secondOtp.getOtp(), "OTP mới phải khác OTP cũ");

            verify(emailService, times(2)).sendEmailAsync(
                    eq(email),
                    eq("Mã xác thực tài khoản"),
                    startsWith("Mã OTP của bạn là: ")
            );

            System.out.println("Test 'testGenerateAndSendOtp_overwriteExistingOtp' thành công");
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_overwriteExistingOtp' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGenerateAndSendOtp_invalidEmail() {
        String invalidEmail = "invalid-email";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.generateAndSendOtp(invalidEmail, type);
            });

            assertEquals("Invalid email address: " + invalidEmail, ex.getMessage());
            verify(emailService, never()).sendEmailAsync(any(), any(), any());

            System.out.println("Test 'testGenerateAndSendOtp_invalidEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_invalidEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGenerateAndSendOtp_emptyEmail() {
        String invalidEmail = "";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.generateAndSendOtp(invalidEmail, type);
            });

            assertEquals("OTP email must not be empty", ex.getMessage());
            verify(emailService, never()).sendEmailAsync(any(), any(), any());

            System.out.println("Test 'testGenerateAndSendOtp_emptyEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_emptyEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGenerateAndSendOtp_invalidType() {
        String invalidType = "Not-A-Type";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.generateAndSendOtp(email, invalidType);
            });

            assertEquals("Invalid type address: " + invalidType, ex.getMessage());
            verify(emailService, never()).sendEmailAsync(any(), any(), any());

            System.out.println("Test 'testGenerateAndSendOtp_invalidType' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_invalidType' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testGenerateAndSendOtp_emptyType() {
        String invalidType = "";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.generateAndSendOtp(email, invalidType);
            });

            assertEquals("OTP type must not be empty", ex.getMessage());
            verify(emailService, never()).sendEmailAsync(any(), any(), any());

            System.out.println("Test 'testGenerateAndSendOtp_emptyType' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testGenerateAndSendOtp_emptyType' thất bại: " + e.getMessage());
        }
    }

}
