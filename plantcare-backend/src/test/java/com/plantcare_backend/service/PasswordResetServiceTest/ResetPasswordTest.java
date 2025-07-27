package com.plantcare_backend.service.PasswordResetServiceTest;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private Cache<String, ResetPasswordRequestDTO> resetPasswordCache;

    private final String email = "test@example.com";
    private final String code = "123456";
    private final String newPassword = "newPass";

    private ResetPasswordRequestDTO dto;
    private Users user;

    @BeforeEach
    void setUp() {
        resetPasswordCache = Caffeine.newBuilder().maximumSize(1000).build();

        // Khởi tạo service bằng constructor thủ công

        // Inject thủ công resetPasswordCache (nếu không dùng constructor cho nó)
        ReflectionTestUtils.setField(passwordResetService, "resetPasswordCache", resetPasswordCache);

        dto = new ResetPasswordRequestDTO(
                email,
                code,
                LocalDateTime.now().plusMinutes(10),
                false
        );

        user = new Users();
        user.setEmail(email);
        user.setPassword("oldPass");
    }

    @Test
    void resetPassword_success() {
        try {
            resetPasswordCache.put(email, dto);

            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
            when(passwordEncoder.encode(newPassword)).thenReturn("encodedPass");

            passwordResetService.resetPassword(email, code, newPassword);

            assertEquals("encodedPass", user.getPassword());
            assertTrue(Objects.requireNonNull(resetPasswordCache.getIfPresent(email)).isUsed());

            verify(userRepository).save(user);

            System.out.println("Test 'resetPassword_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'resetPassword_success' thất bại: " + e.getMessage());
            fail();
        }
    }
}
