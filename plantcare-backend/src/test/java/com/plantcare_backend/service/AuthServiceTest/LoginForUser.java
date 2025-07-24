package com.plantcare_backend.service.AuthServiceTest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
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

import static org.assertj.core.api.Fail.fail;
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
    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private void printResponse(LoginResponse response) throws JsonProcessingException {
        System.out.println("LoginForUserResponse:\n" + mapper.writeValueAsString(response));
    }

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
    void loginForUser_success() throws Exception {
        try {
            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);
            given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");
            given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
            given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");

            LoginResponse response = authService.loginForUser(requestDTO, httpServletRequest);

            assertEquals(HttpStatus.OK.value(), response.getStatus(), "Status code không phải 200 OK");
            assertEquals("Login successful", response.getMessage(), "Message không đúng");
            assertEquals("user123456", response.getUsername(), "Username không đúng");
            assertEquals("jwt-token", response.getToken(), "Token không đúng");
            assertEquals("USER", response.getRole(), "Role không đúng");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_success' thất bại");
        }
    }

    @Test
    void loginForUser_usernameNotFound() {
        try {
            given(userRepository.findByUsername("user123456")).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForUser(requestDTO, httpServletRequest);
            }, "Không ném exception khi username không tồn tại");

            assertEquals("Username wrong!", ex.getMessage(), "Username không đúng");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_usernameNotFound' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_usernameNotFound' thất bại");
        }
    }

    @Test
    void loginForUser_wrongPassword() {
        try {
            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(false);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForUser(requestDTO, httpServletRequest);
            }, "Không ném exception khi password sai");

            assertEquals("password wrong!", ex.getMessage(), "Password không đúng");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_wrongPassword' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_wrongPassword' thất bại");
        }
    }

    @Test
    void loginForUser_userBanned() {
        try {
            user.setStatus(Users.UserStatus.BANNED);
            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForUser(requestDTO, httpServletRequest);
            }, "Không ném exception khi user bị BANNED");

            assertEquals("tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách.", ex.getMessage(),
                    "Status code phải là 401 UNAUTHORIZED nếu tài khoản bị khóa");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_userBanned' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_userBanned' thất bại");
        }
    }

    @Test
    void loginForUser_invalidRoleAdmin() {
        try {
            Role role = new Role();
            role.setRoleName(Role.RoleName.ADMIN);
            user.setRole(role);

            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForUser(requestDTO, httpServletRequest);
            }, "Không ném exception khi role không hợp lệ");

            assertEquals("Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập ở đây.", ex.getMessage(),
                    "Status code phải là 401 UNAUTHORIZED nếu tài khoản không phải là tài khoản của user hoặc vip");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_invalidRoleAdmin' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_invalidRoleAdmin' thất bại");
        }
    }


    @Test
    void loginForUser_invalidRoleStaff() {
        try {
            Role role = new Role();
            role.setRoleName(Role.RoleName.STAFF);
            user.setRole(role);

            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForUser(requestDTO, httpServletRequest);
            }, "Không ném exception khi role không hợp lệ");

            assertEquals("Chỉ tài khoản người dùng (USER, VIP) mới được phép đăng nhập ở đây.", ex.getMessage(),
                    "Status code phải là 401 UNAUTHORIZED nếu tài khoản không phải là tài khoản của user hoặc vip");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_invalidRoleStaff' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_invalidRoleStaff' thất bại");
        }
    }

    @Test
    void loginForUser_userInactive() throws Exception {
        try {
            user.setStatus(Users.UserStatus.INACTIVE);

            given(userRepository.findByUsername("user123456")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

            LoginResponse response = authService.loginForUser(requestDTO, httpServletRequest);

            assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatus(), "Status không phải UNAUTHORIZED");
            assertEquals("tài khoản của bạn chưa xác thực, vui lòng kiểm tra email hoặc gửi lại mã xác minh.",
                    response.getMessage(), "Status code phải là 401 UNAUTHORIZED nếu tài khoản chưa được xác minh");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_userInactive' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_userInactive' thất bại");
        }
    }
}
