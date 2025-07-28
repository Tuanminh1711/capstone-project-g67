package com.plantcare_backend.service.PasswordResetServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.plantcare_backend.dto.request.auth.ResetPasswordRequestDTO;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResetPasswordTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    @Mock
    private Cache<String, ResetPasswordRequestDTO> resetPasswordCache;

    ResetPasswordRequestDTO dto;
    Users user;

    private final String email = "test@example.com";
    private final String code = "123456";
    private final String newPassword = "newSecurePassword";

    @BeforeEach
    void setUp() {
        dto = new ResetPasswordRequestDTO();
        dto.setEmail(email);
        dto.setResetCode(code);
        dto.setUsed(false);
        dto.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        user = new Users();
        user.setEmail(email);
    }

    @Test
    void resetPassword_successful() {
        when(resetPasswordCache.getIfPresent(email)).thenReturn(dto);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(newPassword)).thenReturn("encodedPassword");

        passwordResetService.resetPassword(email, code, newPassword);

        assertEquals("encodedPassword", user.getPassword());
        assertTrue(dto.isUsed());
        verify(userRepository).save(user); // optional but recommended
    }


}
