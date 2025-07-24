package com.plantcare_backend.service.AuthServiceTest;

import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.response.auth.LoginResponse;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.AuthService;
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

    @BeforeEach
    void setUp() {
        requestDTOAdmin = new LoginRequestDTO();
        requestDTOAdmin.setUsername("admin");
        requestDTOAdmin.setPassword("admin123");

        requestDTOStaff = new LoginRequestDTO();
        requestDTOStaff.setUsername("staff");
        requestDTOStaff.setPassword("staff123");

        userStaff = new Users();
        userStaff.setUsername("staffuser");
        userStaff.setPassword("encodedPassword");
        userStaff.setStatus(Users.UserStatus.ACTIVE);

        userAdmin = new Users();
        userAdmin.setUsername("adminuser");
        userAdmin.setPassword("encodedPassword");
        userAdmin.setStatus(Users.UserStatus.ACTIVE);
    }
    @Test
    void loginForAdminOrStaff_adminSuccess() {
        Role adminRole = new Role();
        adminRole.setRoleName(Role.RoleName.ADMIN);
        userAdmin.setRole(adminRole);

        given(userRepository.findByUsername("admin")).willReturn(Optional.of(userAdmin));
        given(passwordEncoder.matches("admin123", "encodedPassword")).willReturn(true);
        given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
        given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");
        given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");
        LoginResponse response = authService.loginForAdminOrStaff(requestDTOAdmin, httpServletRequest);

        assertEquals(HttpStatus.OK.value(), response.getStatus());
        assertEquals("Login successful", response.getMessage());
        assertEquals("jwt-token", response.getToken());
        assertEquals("ADMIN", response.getRole());
    }
    @Test
    void loginForAdminOrStaff_staffSuccess() {
        Role staffRole = new Role();
        staffRole.setRoleName(Role.RoleName.STAFF);
        userStaff.setRole(staffRole);

        given(userRepository.findByUsername("staff")).willReturn(Optional.of(userStaff));
        given(passwordEncoder.matches("staff123", "encodedPassword")).willReturn(true);
        given(httpServletRequest.getRemoteAddr()).willReturn("127.0.0.1");
        given(ipLocationService.getLocationFromIp("127.0.0.1")).willReturn("from Vietnam");
        given(jwtUtil.generateToken(any(String.class), any(String.class), any(int.class))).willReturn("jwt-token");

        LoginResponse response = authService.loginForAdminOrStaff(requestDTOStaff, httpServletRequest);

        assertEquals(HttpStatus.OK.value(), response.getStatus());
        assertEquals("Login successful", response.getMessage());
        assertEquals("jwt-token", response.getToken());
        assertEquals("STAFF", response.getRole());
    }


}