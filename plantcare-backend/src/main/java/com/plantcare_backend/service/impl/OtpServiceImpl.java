package com.plantcare_backend.service.impl;

import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.OtpService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {
    @Autowired
    private EmailService emailService;

    private final Cache<String, OtpData> otpCache;

    public OtpServiceImpl() {
        this.otpCache = Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .build();
    }

    @Override
    public void generateAndSendOtp(String email, String type) {
        String otp = generateRandomOtp();
        LocalDateTime expiredAt = LocalDateTime.now().plusMinutes(10);
        OtpData otpData = OtpData.builder()
                .email(email)
                .otp(otp)
                .expiredAt(expiredAt)
                .used(false)
                .type(type)
                .build();
        otpCache.put(email, otpData);
        String subject = "Mã xác thực tài khoản";
        String content = "Mã OTP của bạn là: " + otp + "\nMã có hiệu lực trong 10 phút.";
        emailService.sendEmailAsync(email, subject, content);
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpCache.getIfPresent(email);
        if (otpData == null || otpData.isUsed() || LocalDateTime.now().isAfter(otpData.getExpiredAt())) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã mới.");
        }
        if (!otpData.getOtp().equals(otp)) {
            throw new RuntimeException("Mã OTP không đúng");
        }
        otpData.setUsed(true);
        otpCache.put(email, otpData);
        return true;
    }

    private String generateRandomOtp() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    @Data
    @Builder
    public static class OtpData {
        private String email;
        private String otp;
        private LocalDateTime expiredAt;
        private boolean used;
        private String type;
    }
}