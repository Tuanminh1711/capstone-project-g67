package com.plantcare_backend.service.AuthServiceTest;

import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.response.auth.LoginResponse;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.IpLocationService;
import com.plantcare_backend.service.impl.AuthServiceImpl;
import com.plantcare_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class LoginForUser {

    @InjectMocks
    private AuthServiceImpl authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest httpServletRequest;

    @Mock
    private IpLocationService ipLocationService;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    private LoginRequestDTO requestDTO;
    private Users user;

    @BeforeEach
    void setUp() {
        requestDTO = new LoginRequestDTO();
        requestDTO.setUsername("user123456");
        requestDTO.setPassword("123456@");

        user = new Users();
        user.setUsername("user123456");
        user.setPassword("encodedPassword");
        user.setStatus(Users.UserStatus.ACTIVE);

        Role role = new Role();
        role.setRoleName(Role.RoleName.USER);
        user.setRole(role);
    }

    @Test
    void loginForUser_success() {
        // Arrange
        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);
        given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class)))
                .willReturn("jwt-token");
        given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
        given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");

        // Act
        LoginResponse response = authService.loginForUser(requestDTO, httpServletRequest);

        // Assert
        assertEquals(HttpStatus.OK.value(), response.getStatus());
        assertEquals("Login successful", response.getMessage());
        assertEquals("user123456", response.getUsername());
        assertEquals("jwt-token", response.getToken());
        assertEquals("USER", response.getRole());
    }

    @Test
    void loginForUser_usernameNotFound() {
        given(userRepository.findByUsername("user123456")).willReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginForUser(requestDTO, httpServletRequest);
        });

        assertEquals("Username wrong!", exception.getMessage());
    }

    @Test
    void loginForUser_wrongPassword() {
        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginForUser(requestDTO, httpServletRequest);
        });

        assertEquals("password wrong!", exception.getMessage());
    }

    @Test
    void loginForUser_userBanned() {
        user.setStatus(Users.UserStatus.BANNED);
        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginForUser(requestDTO, httpServletRequest);
        });

        assertEquals("tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.", exception.getMessage());
    }

    @Test
    void loginForUser_invalidRoleAdmin() {
        Role role = new Role();
        role.setRoleName(Role.RoleName.ADMIN);
        user.setRole(role);

        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginForUser(requestDTO, httpServletRequest);
        });

        assertEquals("Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập ở đây.", exception.getMessage());
    }

    @Test
    void loginForUser_invalidRoleStaff() {
        Role role = new Role();
        role.setRoleName(Role.RoleName.STAFF);
        user.setRole(role);

        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginForUser(requestDTO, httpServletRequest);
        });

        assertEquals("Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập ở đây.", exception.getMessage());
    }

    @Test
    void loginForUser_userInactive() {
        user.setStatus(Users.UserStatus.INACTIVE);

        given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

        LoginResponse response = authService.loginForUser(requestDTO, httpServletRequest);

        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatus());
        assertEquals("tài khoản của bạn chưa xác thực, vui lòng kiểm tra email hoặc gửi lại mã xác minh.", response.getMessage());
        assertEquals("user123456", response.getUsername());
    }

}
