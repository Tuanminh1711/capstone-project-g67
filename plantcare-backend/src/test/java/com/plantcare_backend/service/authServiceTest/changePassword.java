package com.plantcare_backend.service.authServiceTest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Fail.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class changePassword {
    @InjectMocks
    private AuthServiceImpl authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private Users user;
    private ChangePasswordRequestDTO requestDTO;

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);


    private void printResponse(ResponseData<?> response) throws JsonProcessingException {
        System.out.println("LoginResponse:");
        System.out.println(mapper.writeValueAsString(response));
    }


    @BeforeEach
    void setUp() {
        user = new Users();
        user.setId(1);
        user.setPassword("encodedOldPassword");

        requestDTO = new ChangePasswordRequestDTO();
        requestDTO.setCurrentPassword("oldPassword");
        requestDTO.setNewPassword("newPassword123");
        requestDTO.setConfirmPassword("newPassword123");
    }

    @Test
    void changePassword_success() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("oldPassword", "encodedOldPassword")).willReturn(true);
            given(passwordEncoder.encode("newPassword123")).willReturn("encodedNewPassword");

            ResponseData<?> response = authService.changePassword(requestDTO, 1);

            assertEquals(HttpStatus.OK.value(), response.getStatus());
            assertEquals("Password changed successfully", response.getMessage());

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'changePassword_success' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'changePassword_success' thất bại");
        }
    }

    @Test
    void changePassword_wrongCurrentPassword() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("oldPassword", "encodedOldPassword")).willReturn(false);

            ResponseData<?> response = authService.changePassword(requestDTO, 1);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
            assertEquals("Current password is incorrect", response.getMessage());

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'changePassword_wrongCurrentPassword' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'changePassword_wrongCurrentPassword' thất bại");
        }
    }


    @Test
    void changePassword_confirmPasswordMismatch() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("oldPassword", "encodedOldPassword")).willReturn(true);

            requestDTO.setConfirmPassword("mismatchPassword");

            ResponseData<?> response = authService.changePassword(requestDTO, 1);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
            assertEquals("New password and confirm password do not match", response.getMessage());
            verify(userRepository, never()).save(any());
            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'changePassword_confirmPasswordMismatch' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'changePassword_confirmPasswordMismatch' thất bại");
        }
    }

    @Test
    void changePassword_userNotFound() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.empty());

            ResponseData<?> response = authService.changePassword(requestDTO, 1);

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatus());
            assertTrue(response.getMessage().contains("User not found"));
            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'changePassword_userNotFound' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'changePassword_userNotFound' thất bại");
        }
    }

    @Test
    void changePassword_newPasswordSameAsCurrentPassword() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("oldPassword", "encodedOldPassword")).willReturn(true);
            given(passwordEncoder.matches("newPassword123", "encodedOldPassword")).willReturn(true); // newPassword giống old

            ResponseData<?> response = authService.changePassword(requestDTO, 1);

            assertEquals("New password must be different from current password", response.getMessage(),
                    "Status code phải là 400 BAD_REQUEST nếu mật khẩu mới giống mật khẩu cũ");

            verify(userRepository, never()).save(any());
            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'changePassword_newPasswordSameAsCurrentPassword' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'changePassword_newPasswordSameAsCurrentPassword' thất bại");
        }
    }

}
