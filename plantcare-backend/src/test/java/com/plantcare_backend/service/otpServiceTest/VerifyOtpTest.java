package com.plantcare_backend.service.otpServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.plantcare_backend.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class VerifyOtpTest {

    @InjectMocks
    private OtpServiceImpl otpService;

    private Cache<String, OtpServiceImpl.OtpData> otpCache;

    OtpServiceImpl.OtpData otpData;

    String email = "user@example.com";
    String otp = "123456";


    @BeforeEach
    void setUp() {
        otpCache = Caffeine.newBuilder().expireAfterWrite(10, TimeUnit.MINUTES).build();
        ReflectionTestUtils.setField(otpService, "otpCache", otpCache);

        otpData = OtpServiceImpl.OtpData.builder()
                .email(email)
                .otp(otp)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .type("REGISTER")
                .build();

        otpCache.put(email, OtpServiceImpl.OtpData.builder()
                .email(email)
                .otp(otp)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .type("REGISTER")
                .build());
    }

    @Test
    void verifyOtp_success() {
        try {
            otpCache.put(email, otpData);

            boolean result = otpService.verifyOtp(email, otp);

            assertTrue(result);
            assertTrue(otpCache.getIfPresent(email).isUsed());

            System.out.println("Test 'verifyOtp_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'verifyOtp_success' thất bại: " + e.getMessage());
        }
    }


    @Test
    void testVerifyOtp_wrongOtp() {
        String wrongOtp = "654321";
        try {
            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                otpService.verifyOtp(email, wrongOtp);
            });

            assertEquals("Mã OTP không đúng", ex.getMessage());

            System.out.println("Test 'testVerifyOtp_wrongOtp' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testVerifyOtp_wrongOtp' thất bại: " + e.getMessage());
        }
    }

    @Test
    void testVerifyOtp_nullOtp() {
        String wrongOtp = "";
        try {
            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                otpService.verifyOtp(email, wrongOtp);
            });

            assertEquals("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã mới.", ex.getMessage());

            System.out.println("Test 'testVerifyOtp_wrongOtp' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'testVerifyOtp_wrongOtp' thất bại: " + e.getMessage());
        }
    }

    @Test
    void verifyOtp_expiredOtp() {
        try {
            String email = "expired@example.com";
            otpCache.put(email, OtpServiceImpl.OtpData.builder()
                    .email(email)
                    .otp("123456")
                    .expiredAt(LocalDateTime.now().minusMinutes(1))
                    .used(false)
                    .type("REGISTER")
                    .build());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                otpService.verifyOtp(email, "123456");
            });

            assertEquals("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã mới.", ex.getMessage());

            System.out.println("Test 'verifyOtp_expiredOtp' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'verifyOtp_expiredOtp' thất bại: " + e.getMessage());
        }
    }

    @Test
    void verifyOtp_alreadyUsedOtp() {
        try {
            String email = "used@example.com";
            otpCache.put(email, OtpServiceImpl.OtpData.builder()
                    .email(email)
                    .otp("123456")
                    .expiredAt(LocalDateTime.now().plusMinutes(5))
                    .used(true)
                    .type("REGISTER")
                    .build());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                otpService.verifyOtp(email, "123456");
            });

            assertEquals("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã mới.", ex.getMessage());

            System.out.println("Test 'verifyOtp_alreadyUsedOtp' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'verifyOtp_alreadyUsedOtp' thất bại: " + e.getMessage());
        }
    }

    @Test
    void verifyOtp_invalidEmail() {
        try {
            email = "invalid-email";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.verifyOtp(email, otp);
            });

            assertEquals("Invalid email address: " + email, ex.getMessage());

            System.out.println("Test 'verifyOtp_invalidEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'verifyOtp_invalidEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void verifyOtp_nullEmail() {
        try {
            email = "";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                otpService.verifyOtp(email, otp);
            });

            assertEquals("Invalid email address: " + email, ex.getMessage());

            System.out.println("Test 'verifyOtp_nullEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'verifyOtp_nullEmail' thất bại: " + e.getMessage());
        }
    }

}
