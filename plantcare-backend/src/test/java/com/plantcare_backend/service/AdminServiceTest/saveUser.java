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
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Fail.fail;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class saveUser {

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


    private Validator validator;

    private UserRequestDTO request;
    private Role role;
    private Users savedUser;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

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
        try {
            when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(userProfileRepository.existsByPhone(request.getPhoneNumber())).thenReturn(false);
            when(roleRepository.findById(request.getRoleId())).thenReturn(Optional.of(role));
            when(userRepository.save(any(Users.class))).thenReturn(savedUser);

            long userId = adminService.saveUser(request);

            assertEquals(123L, userId);
            System.out.println("saveUser_success passed with ID: " + userId);
        } catch (Exception e) {
            System.out.println("Test 'saveUser_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_success' thất bại");
        }
    }

    @Test
    void saveUser_usernameAlreadyExists() {
        try {
            when(userRepository.existsByUsername(request.getUsername())).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                adminService.saveUser(request);
            });
            assertEquals("Username already exists", exception.getMessage());
            System.out.println("saveUser failed: " + exception.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'saveUser_usernameAlreadyExists' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_usernameAlreadyExists' thất bại");
        }
    }

    @Test
    void saveUser_emailAlreadyExists() {
        try {
            when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                adminService.saveUser(request);
            });

            assertEquals("Email already exists", exception.getMessage());
            System.out.println("saveUser failed: " + exception.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'saveUser_emailAlreadyExists' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_emailAlreadyExists' thất bại");
        }
    }

    @Test
    void saveUser_phoneNumberAlreadyExists() {
        try {
            when(userProfileRepository.existsByPhone(request.getPhoneNumber())).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                adminService.saveUser(request);
            });

            assertEquals("Phone number already exists", exception.getMessage());
            System.out.println("saveUser failed: " + exception.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'saveUser_phoneAlreadyExists' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_phoneAlreadyExists' thất bại");
        }
    }

    @Test
    void saveUser_blankUsername() {
        try {
            request.setUsername("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_blankUsername' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_blankUsername' thất bại");
        }
    }

    @Test
    void saveUser_blankPassword() {
        try {
            request.setPassword("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser_blankPassword failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_blankPassword' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_blankPassword' thất bại");
        }
    }

    @Test
    void saveUser_blankFullName() {
        try {
            request.setFullName("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            Exception exception = assertThrows(Exception.class, () -> {
                adminService.saveUser(request);
            });
            System.out.println("Caught exception of type: " + exception.getClass().getName());

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());

            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_blankFullName' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_blankFullName' thất bại");
        }
    }

    @Test
    void saveUser_blankEmail() {
        try {
            request.setEmail("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_blankEmail' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_blankEmail' thất bại");
        }
    }

    @Test
    void saveUser_blankPhoneNumber() {
        try {
            request.setPhoneNumber("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed: " + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_blankUsername' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_blankUsername' thất bại");
        }
    }

    @Test
    void saveUser_invalidPassword() {
        try {
            request.setPassword("123");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed: " + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_invalidPassword' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_invalidPassword' thất bại");
        }
    }

    @Test
    void saveUser_invalidFullName() {
        try {
            request.setFullName("Nguyen Van 9@");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed: " + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_invalidFullName' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_invalidFullName' thất bại");
        }
    }

    @Test
    void saveUser_invalidEmail() {
        try {
            request.setEmail("invalid-email");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed: " + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_invalidFullName' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_invalidFullName' thất bại");
        }
    }

    @Test
    void saveUser_invalidPhoneNumber() {
        try {
            request.setPhoneNumber("notaphone@");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("saveUser failed: " + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'saveUser_invalidFullName' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'saveUser_invalidFullName' thất bại");
        }
    }
}
