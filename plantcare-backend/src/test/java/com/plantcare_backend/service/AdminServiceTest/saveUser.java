package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.OtpService;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import com.plantcare_backend.util.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class saveUser {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;

    private UserRequestDTO request;
    private Role role;
    private Users savedUser;

    @BeforeEach
    void setUp() {
        request = new UserRequestDTO();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("securePass123");
        request.setPhoneNumber("0912345678");
        request.setFullName("Nguyen Van A");
        request.setGender(Gender.MALE);
        request.setRoleId(1);

        role = new Role();
        role.setId(1);
        role.setRoleName(Role.RoleName.ADMIN);

        savedUser = Users.builder()
                .id(123)
                .username(request.getUsername())
                .email(request.getEmail())
                .password("encodedPassword")
                .status(Users.UserStatus.ACTIVE)
                .role(role)
                .build();
    }
    @Test
    void saveUser_success() {
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userProfileRepository.existsByPhone(request.getPhoneNumber())).thenReturn(false);
        when(roleRepository.findById(1)).thenReturn(Optional.of(role));
        when(userRepository.save(any(Users.class))).thenReturn(savedUser);

        long userId = adminService.saveUser(request);

        assertEquals(123L, userId);
        System.out.println("saveUser_success passed with ID: " + userId);
    }

}
