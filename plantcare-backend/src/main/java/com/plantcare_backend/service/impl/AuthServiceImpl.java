package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.response.auth.LoginResponse;
import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.UserActivityLog;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.AuthService;
import com.plantcare_backend.service.IpLocationService;
import com.plantcare_backend.service.OtpService;
import com.plantcare_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Create by TaHoang
 */

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final JwtUtil jwtUtil;
    @Autowired
    private final RoleRepository roleRepository;
    @Autowired
    private final UserProfileRepository userProfileRepository;
    @Autowired
    private final PasswordEncoder passwordEncoder;
    @Autowired
    private final UserActivityLogRepository userActivityLogRepository;
    @Autowired
    private final IpLocationService ipLocationService;
    @Autowired
    private final OtpService otpService;

    @Override
    public LoginResponse loginForUser(LoginRequestDTO loginRequestDTO, HttpServletRequest request) {
        Users user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username wrong!"));
        if (user.getStatus() == Users.UserStatus.BANNED) {
            throw new RuntimeException("tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.");
        }
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("password wrong!");
        }

        if (user.getRole() == null || user.getRole().getRoleName() != Role.RoleName.USER) {
            throw new RuntimeException("Chỉ tài khoản người dùng (USER) mới được phép đăng nhập ở đây.");
        }

        if (user.getStatus() == Users.UserStatus.INACTIVE) {
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            loginResponse.setMessage("tài khoản của bạn chưa xác thực, vui lòng kiểm tra email hoặc gửi lại mã xác minh.");
            loginResponse.setUsername(user.getUsername());
            loginResponse.setEmail(user.getEmail());
            loginResponse.setRequiresVerification(true);
            return loginResponse;
        }

        String ipAddress = getClientIp(request);
        String location = ipLocationService.getLocationFromIp(ipAddress);

        UserActivityLog log = UserActivityLog.builder()
                .user(user)
                .action("LOGIN")
                .ipAddress(ipAddress)
                .timestamp(LocalDateTime.now())
                .description("User logged in successfully " + location)
                .build();
        userActivityLogRepository.save(log);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName().toString(), user.getId());

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(token);
        loginResponse.setUsername(user.getUsername());
        loginResponse.setMessage("Login successful");
        loginResponse.setStatus(HttpStatus.OK.value());
        loginResponse.setRole(user.getRole().getRoleName().toString());
        return loginResponse;
    }

    @Override
    public LoginResponse loginForAdminOrStaff(LoginRequestDTO loginRequestDTO, HttpServletRequest request) {
        Users user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username wrong!"));
        if (user.getStatus() == Users.UserStatus.BANNED) {
            throw new RuntimeException("Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.");
        }
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("Password wrong!");
        }
        // Chỉ cho phép ADMIN hoặc STAFF
        if (user.getRole() == null ||
                !(user.getRole().getRoleName() == Role.RoleName.ADMIN || user.getRole().getRoleName() == Role.RoleName.STAFF)) {
            throw new RuntimeException("Chỉ tài khoản ADMIN hoặc STAFF mới được phép đăng nhập ở đây.");
        }
        // (Có thể kiểm tra thêm trạng thái nếu muốn)
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName().toString(), user.getId());
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(token);
        loginResponse.setUsername(user.getUsername());
        loginResponse.setMessage("Login successful");
        loginResponse.setStatus(HttpStatus.OK.value());
        loginResponse.setRole(user.getRole().getRoleName().toString());
        return loginResponse;
    }

    // hàm lấy IP
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    @Override
    public ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO) {
        try {
            if (userRepository.existsByUsername(registerRequestDTO.getUsername())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Username already exists");
            }

            if (userRepository.existsByEmail(registerRequestDTO.getEmail())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Email already exists");
            }

            if (!registerRequestDTO.getPassword().equals(registerRequestDTO.getConfirmPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Password and confirm password do not match");
            }

            Users user = new Users();
            user.setUsername(registerRequestDTO.getUsername());
            user.setEmail(registerRequestDTO.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));
            user.setStatus(Users.UserStatus.INACTIVE);

            Role userRole = roleRepository.findByRoleName(Role.RoleName.USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            user.setRole(userRole);

            Users savedUser = userRepository.save(user);

            try {
                UserProfile userProfile = new UserProfile();
                userProfile.setUser(savedUser);
                userProfile.setFullName(registerRequestDTO.getFullName());
                userProfile.setPhone(registerRequestDTO.getPhone());
                userProfile.setGender(null);
                userProfile.setLivingEnvironment(null);
                userProfile.setAvatarUrl(null);

                userProfileRepository.save(userProfile);
            } catch (Exception e) {
                userRepository.delete(savedUser);
                throw new RuntimeException("Failed to create user profile: " + e.getMessage());
            }
            savedUser.setPassword(null);

            otpService.generateAndSendOtp(user.getEmail(), "REGISTER");

            return new ResponseData<>(HttpStatus.CREATED.value(), "đăng ký thành công. vui lòng kiểm tra email" +
                    "để xác thực tài khoản ", savedUser);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error registering user: " + e.getMessage());
        }
    }

    @Override
    public ResponseData<?> logout(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Invalid authorization header");
            }
            String token = authHeader.substring(7);
            jwtUtil.addToBlacklist(token);
            SecurityContextHolder.clearContext();
            return new ResponseData<>(HttpStatus.OK.value(), "Logout successful");
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error during logout: " + e.getMessage());
        }
    }

    @Override
    public ResponseData<?> changePassword(ChangePasswordRequestDTO requestDTO, Integer userId) {
        try {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), user.getPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Current password is incorrect");
            }

            if (!requestDTO.getNewPassword().equals(requestDTO.getConfirmPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(),
                        "New password and confirm password do not match");
            }

            user.setPassword(passwordEncoder.encode(requestDTO.getNewPassword()));
            userRepository.save(user);

            return new ResponseData<>(HttpStatus.OK.value(), "Password changed successfully");
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error changing password: " + e.getMessage());
        }
    }

}
