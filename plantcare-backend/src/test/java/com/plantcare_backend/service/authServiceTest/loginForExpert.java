package com.plantcare_backend.service.authServiceTest;

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
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class LoginForExpert {

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
    private LoginRequestDTO requestDTOStaff;
    private Users user;
    private Users userStaff;


    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private void printResponse(LoginResponse response) throws Exception {
        System.out.println("LoginForExpertResponse:\n" + mapper.writeValueAsString(response));
    }

    @BeforeEach
    void setUp() {
        requestDTO = new LoginRequestDTO();
        requestDTO.setUsername("expert123");
        requestDTO.setPassword("123456@");

        requestDTOStaff = new LoginRequestDTO();
        requestDTOStaff.setUsername("userStaff");
        requestDTOStaff.setPassword("staff123");

        user = new Users();
        user.setUsername("expert123");
        user.setPassword("encodedPassword");

        Role role = new Role();
        role.setRoleName(Role.RoleName.EXPERT);
        user.setRole(role);

        userStaff = new Users();
        userStaff.setUsername("userStaff");
        userStaff.setPassword("encodedPassword");

        Role roleStaff = new Role();
        roleStaff.setRoleName(Role.RoleName.STAFF);
        userStaff.setRole(roleStaff);
    }

    @Test
    void loginForExpert_success() throws Exception {
        try {
            given(userRepository.findByUsername("expert123")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);
            given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");
            given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
            given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");

            LoginResponse response = authService.loginForExpert(requestDTO, httpServletRequest);

            assertEquals(HttpStatus.OK.value(), response.getStatus());
            assertEquals("Login successful", response.getMessage());
            assertEquals("expert123", response.getUsername());
            assertEquals("jwt-token", response.getToken());
            assertEquals("EXPERT", response.getRole());

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForExpert_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForExpert_success' thất bại");
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
    void loginForExpert_usernameNotFound() {
        given(userRepository.findByUsername("expert123")).willReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.loginForExpert(requestDTO, httpServletRequest);
        });

        assertEquals("Username wrong!", ex.getMessage(), "Username không đúng");
        System.out.println("Exception đúng như mong đợi: " + ex.getMessage());
    }

    @Test
    void loginForExpert_wrongPassword() {
        given(userRepository.findByUsername("expert123")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.loginForExpert(requestDTO, httpServletRequest);
        });

        assertEquals("Password wrong!", ex.getMessage());
        System.out.println("Exception đúng như mong đợi: " + ex.getMessage());
    }

    @Test
    void loginForExpert_bannedAccount() {
        user.setStatus(Users.UserStatus.BANNED);
        given(userRepository.findByUsername("expert123")).willReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.loginForExpert(requestDTO, httpServletRequest);
        });

        assertEquals("Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách.", ex.getMessage());
        System.out.println("Exception đúng như mong đợi: " + ex.getMessage());
    }

    @Test
    void loginForExpert_invalidRole() {
        Role role = new Role();
        role.setRoleName(Role.RoleName.USER);
        user.setRole(role);

        given(userRepository.findByUsername("expert123")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("123456@", "encodedPassword")).willReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            authService.loginForExpert(requestDTO, httpServletRequest);
        });

        assertEquals("Chỉ tài khoản EXPERT hoặc STAFF mới được phép đăng nhập ở đây.", ex.getMessage());
        System.out.println("Exception đúng như mong đợi: " + ex.getMessage());
    }
}
