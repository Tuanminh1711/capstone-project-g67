package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.LoginResponse;
import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.request.auth.ForgotPasswordRequestDTO;
import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.service.PasswordResetService;
import com.plantcare_backend.service.impl.AuthServiceImpl;
import com.plantcare_backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Create by TaHoang
 */

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {
    @Autowired
    private AuthServiceImpl authService;
    @Autowired
    private PasswordResetService passwordResetService;
    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "User Login", description = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> Login(@Valid @RequestBody LoginRequestDTO loginRequestDTO, HttpServletRequest request) {
        LoginResponse loginResponse = authService.loginForUser(loginRequestDTO, request);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<ResponseData<?>> registerForUser(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
        System.out.println("Register request: " + registerRequestDTO);
        ResponseData<?> responseData = authService.registerForUser(registerRequestDTO);
        return ResponseEntity.status(responseData.getStatus()).body(responseData);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            jwtUtil.addToBlacklist(token);

            return ResponseEntity.ok()
                    .body(Map.of(
                            "status", 200,
                            "message", "Logout successful",
                            "invalidated_token", token));
        }

        return ResponseEntity.badRequest().body("Missing authorization header");
    }

    // Endpoint yêu cầu reset password
    @Operation(summary = "Forgot Password", description = "Request password reset code")
    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseData<?>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
        try {
            passwordResetService.createPasswordResetToken(request.getEmail());
            return ResponseEntity
                    .ok(new ResponseData<>(HttpStatus.OK.value(), "Reset code has been sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        }
    }

    // Endpoint xác thực mã reset
    @Operation(summary = "Verify Reset Code", description = "Verify password reset code")
    @PostMapping("/verify-reset-code")
    public ResponseEntity<ResponseData<?>> verifyResetCode(
            @RequestParam @NotBlank String email,
            @RequestParam @NotBlank String code) {
        try {
            boolean isValid = passwordResetService.validateResetCode(email, code);
            if (isValid) {
                return ResponseEntity.ok(new ResponseData<>(HttpStatus.OK.value(), "Code is valid"));
            }
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Invalid or expired code"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        }
    }

    // Endpoint đặt mật khẩu mới
    @Operation(summary = "Reset Password", description = "Reset password with code")
    @PostMapping("/reset-password")
    public ResponseEntity<ResponseData<?>> resetPassword(
            @RequestParam @NotBlank String email,
            @RequestParam @NotBlank String code,
            @RequestParam @NotBlank String newPassword) {
        try {
            passwordResetService.resetPassword(email, code, newPassword);
            return ResponseEntity.ok(new ResponseData<>(HttpStatus.OK.value(), "Password has been reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        }
    }

    @Operation(summary = "Change Password", description = "Change user password")
    @PostMapping("/change-password")
    public ResponseEntity<ResponseData<?>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO requestDTO,
            @RequestAttribute("username") String username) {
        ResponseData<?> response = authService.changePassword(requestDTO, username);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
}
