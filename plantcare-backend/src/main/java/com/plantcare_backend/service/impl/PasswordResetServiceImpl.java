package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.ResetPasswordRequestDTO;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.PasswordResetService;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    @Autowired
    private EmailService emailService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Cache<String, ResetPasswordRequestDTO> resetPasswordCache;

    public PasswordResetServiceImpl() {
        this.resetPasswordCache = Caffeine.newBuilder()
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .build();
    }

    @Override
    public void createPasswordResetToken(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email not found in system");
        }

        String resetCode = generateRandomCode();
        ResetPasswordRequestDTO data = new ResetPasswordRequestDTO(
                email,
                resetCode,
                LocalDateTime.now().plusMinutes(15),
                false
        );
        resetPasswordCache.put(email, data);

        try {
            emailService.sendResetCodeEmail(email, resetCode);
            log.info("Reset code sent to email: {}", email);
        } catch (Exception e) {
            log.error("Failed to send reset code to email: {}", email, e);
            throw new RuntimeException("Failed to send reset code: " + e.getMessage());
        }
    }

    @Override
    public boolean validateResetCode(String email, String code) {
        ResetPasswordRequestDTO data = resetPasswordCache.getIfPresent(email);
        if (data == null || data.isUsed() ||
                LocalDateTime.now().isAfter(data.getExpiryTime())) {
            return false;
        }
        return data.getResetCode().equals(code);
    }

    @Override
    public void resetPassword(String email, String code, String newPassword) {
        if (!validateResetCode(email, code)) {
            throw new RuntimeException("Invalid or expired reset code");
        }

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Đánh dấu code đã sử dụng
        ResetPasswordRequestDTO data = resetPasswordCache.getIfPresent(email);
        data.setUsed(true);
        resetPasswordCache.put(email, data);

        log.info("Password reset successful for email: {}", email);
    }

    private String generateRandomCode() {
        // Tạo mã 6 số ngẫu nhiên
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Số ngẫu nhiên từ 100000 đến 999999
        return String.valueOf(code);
    }
}
