package com.plantcare_backend.service.authServiceTest;

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
class LoginForAdminOrStaff {

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

    private LoginRequestDTO requestDTOAdmin;

    private LoginRequestDTO requestDTOStaff;


    private Users userAdmin;
    private Users userStaff;

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);


    private void printResponse(LoginResponse response) throws JsonProcessingException {
        System.out.println("LoginResponse:");
        System.out.println(mapper.writeValueAsString(response));
    }

    @BeforeEach
    void setUp() {
        requestDTOAdmin = new LoginRequestDTO();
        requestDTOAdmin.setUsername("userAdmin");
        requestDTOAdmin.setPassword("admin123");

        requestDTOStaff = new LoginRequestDTO();
        requestDTOStaff.setUsername("userStaff");
        requestDTOStaff.setPassword("staff123");

        userStaff = new Users();
        userStaff.setUsername("userStaff");
        userStaff.setPassword("encodedPassword");

        userAdmin = new Users();
        userAdmin.setUsername("userAdmin");
        userAdmin.setPassword("encodedPassword");
    }

    @Test
    void loginForAdminOrStaff_success_admin() throws Exception {
        try {
            Role adminRole = new Role();
            adminRole.setRoleName(Role.RoleName.ADMIN);
            userAdmin.setRole(adminRole);

            given(userRepository.findByUsername("userAdmin")).willReturn(Optional.of(userAdmin));
            given(passwordEncoder.matches("admin123", "encodedPassword")).willReturn(true);
            given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");
            given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
            given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");

            LoginResponse response = authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);

            assertEquals(HttpStatus.OK.value(), response.getStatus(), "Status không phải 200 OK");
            assertEquals("Login successful", response.getMessage(), "Message không đúng");
            assertEquals("userAdmin", response.getUsername(), "Username không đúng");
            assertEquals("jwt-token", response.getToken(), "Token không đúng");
            assertEquals("ADMIN", response.getRole(), "Role không đúng");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_success_admin' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_success_admin' thất bại");
        }
    }

    @Test
    void loginForAdminOrStaff_success_staff() throws Exception {
        try {
            Role staffRole = new Role();
            staffRole.setRoleName(Role.RoleName.STAFF);
            userStaff.setRole(staffRole);

            given(userRepository.findByUsername("userStaff")).willReturn(Optional.of(userStaff));
            given(passwordEncoder.matches("staff123", "encodedPassword")).willReturn(true);
            given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");
            given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
            given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");

            LoginResponse response = authService.loginForAdminOrStaff(requestDTOStaff, httpServletRequest);

            assertEquals(HttpStatus.OK.value(), response.getStatus(), "Status không phải 200 OK");
            assertEquals("Login successful", response.getMessage(), "Message không đúng");
            assertEquals("userStaff", response.getUsername(), "Username không đúng");
            assertEquals("jwt-token", response.getToken(), "Token không đúng");
            assertEquals("STAFF", response.getRole(), "Role không đúng");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_success_staff' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_success_staff' thất bại");
        }
    }

    @Test
    void loginForAdminOrStaff_invalidRole_user() {
        try {
            Role userRole = new Role();
            userRole.setRoleName(Role.RoleName.USER);
            userAdmin.setRole(userRole);

            given(userRepository.findByUsername("userAdmin")).willReturn(Optional.of(userAdmin));
            given(passwordEncoder.matches("admin123", "encodedPassword")).willReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);
            });
            assertEquals("Chỉ tài khoản ADMIN hoặc STAFF mới được phép đăng nhập ở đây.", ex.getMessage(),
                    "Status code phải là 401 UNAUTHORIZED nếu tài khoản không phải là tài khoản admin hoặc staff");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_invalidRole_user' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_invalidRole_user' thất bại");
        }
    }


    @Test
    void loginForAdminOrStaff_usernameNotFound() {
        try {
            given(userRepository.findByUsername("userAdmin")).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);
            });
            assertEquals("Username wrong!", ex.getMessage(), "Username không đúng");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_usernameNotFound' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_usernameNotFound' thất bại");
        }
    }

    @Test
    void loginForAdminOrStaff_wrongPassword() {
        try {
            Role adminRole = new Role();
            adminRole.setRoleName(Role.RoleName.ADMIN);
            userAdmin.setRole(adminRole);

            given(userRepository.findByUsername("userAdmin")).willReturn(Optional.of(userAdmin));
            given(passwordEncoder.matches("admin123", "encodedPassword")).willReturn(false);

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);
            });
            assertEquals("Password wrong!", ex.getMessage(), "Password không đúng");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_wrongPassword' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_wrongPassword' thất bại");
        }
    }

    @Test
    void loginForAdminOrStaff_userBanned() {
        try {
            userAdmin.setStatus(Users.UserStatus.BANNED);
            given(userRepository.findByUsername("userAdmin")).willReturn(Optional.of(userAdmin));

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);
            });

            assertEquals("Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.", ex.getMessage(),
                    "Status code phải là 401 UNAUTHORIZED nếu tài khoản bị khóa");
            System.out.println("Exception được ném như mong đợi: " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'loginForAdminOrStaff_userBanned' lỗi: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForAdminOrStaff_userBanned' thất bại");
        }
    }

}