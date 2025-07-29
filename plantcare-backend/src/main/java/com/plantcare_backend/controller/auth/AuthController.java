package com.plantcare_backend.controller.auth;

import com.plantcare_backend.annotation.RateLimit;
import com.plantcare_backend.dto.response.auth.LoginResponse;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.request.auth.ForgotPasswordRequestDTO;
import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.PasswordResetService;
import com.plantcare_backend.service.AuthService;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.util.JwtUtil;
import com.plantcare_backend.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Create by TaHoang
 */

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication APIs")
@CrossOrigin(origins = "http://localhost:4200/")
public class AuthController {
    @Autowired
    private final AuthService authService;
    @Autowired
    private final PasswordResetService passwordResetService;
    @Autowired
    private final JwtUtil jwtUtil;
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private OtpService otpService;
    @Autowired
    private ActivityLogService activityLogService;

    @Operation(summary = "Admin/Staff Login", description = "Login for admin or staff")
    @PostMapping("/login-admin")
    public ResponseEntity<LoginResponse> loginAdmin(@Valid @RequestBody LoginRequestDTO loginRequestDTO,
                                                    HttpServletRequest request) {
        LoginResponse loginResponse = authService.loginForAdminOrStaff(loginRequestDTO, request);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/login-expert")
    public ResponseEntity<LoginResponse> loginExpert(@Valid @RequestBody LoginRequestDTO loginRequestDTO,
                                                     HttpServletRequest request) {
        LoginResponse loginResponse = authService.loginForExpert(loginRequestDTO, request);
        return ResponseEntity.ok(loginResponse);
    }

    @Operation(summary = "User Login", description = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> Login(@Valid @RequestBody LoginRequestDTO loginRequestDTO,
                                               HttpServletRequest request) {
        LoginResponse loginResponse = authService.loginForUser(loginRequestDTO, request);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ResponseData<?>> resendVerification(@RequestParam String email) {
        try {
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getStatus() == Users.UserStatus.ACTIVE) {
                return ResponseEntity.badRequest()
                        .body(new ResponseData<>(400, "Tài khoản đã được xác thực"));
            }

            otpService.generateAndSendOtp(email, "REGISTER");

            return ResponseEntity.ok(new ResponseData<>(200, "Đã gửi lại mã xác nhận"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(400, e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ResponseData<?>> verifyEmail(
            @RequestParam String email,
            @RequestParam String otp) {
        try {
            boolean isValid = otpService.verifyOtp(email, otp);

            if (isValid) {
                Users user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                user.setStatus(Users.UserStatus.ACTIVE);
                userRepository.save(user);

                return ResponseEntity.ok(new ResponseData<>(200, "Xác thực thành công"));
            }
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(400, "Mã OTP không hợp lệ"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(400, e.getMessage()));
        }
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

            // Get user info from token before blacklisting
            try {
                int userId = jwtUtil.getUserIdFromToken(token).intValue();
                String username = jwtUtil.getUsernameFromToken(token);

                // Log the logout activity
                activityLogService.logActivity(userId, "LOGOUT",
                        "User logged out: " + username, request);
            } catch (Exception e) {
                // Token might be invalid, just continue with logout
            }

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

    /**
     * Đổi mật khẩu cho user đã đăng nhập.
     */
    @Operation(summary = "Change Password", description = "Change user password")
    @RateLimit(value = 3, timeUnit = TimeUnit.MINUTES) // gioi han 3 lan trong 5 phut.
    @PostMapping("/change-password")
    public ResponseEntity<ResponseData<?>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO requestDTO,
            @RequestAttribute("userId") Integer userId) {
        ResponseData<?> response = authService.changePassword(requestDTO, userId);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ResponseData<LoginResponse>> refreshToken(
            HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseData<>(HttpStatus.UNAUTHORIZED.value(),
                            "User not authenticated", null));
        }

        try {
            Users user = userRepository.findById(userId.intValue())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String newToken = jwtUtil.generateToken(
                    user.getUsername(),
                    user.getRole().getRoleName().toString(),
                    user.getId()
            );

            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(newToken);
            loginResponse.setUsername(user.getUsername());
            loginResponse.setMessage("Token refreshed successfully");
            loginResponse.setStatus(HttpStatus.OK.value());
            loginResponse.setRole(user.getRole().getRoleName().toString());

            return ResponseEntity.ok(new ResponseData<>(
                    HttpStatus.OK.value(),
                    "Token refreshed successfully",
                    loginResponse));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "Failed to refresh token: " + e.getMessage(), null));
        }
    }
}
