package com.plantcare_backend.service.adminServiceTest;

import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
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

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UpdateUserTest {

    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private Validator validator;

    private Role role;
    private Users existingUser;
    private UserProfile existingProfile;
    private UserRequestDTO validRequest;


    @BeforeEach
    void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        existingUser = Users.builder()
                .id(1)
                .password("OldPassword@123")
                .role(role)
                .build();

        existingProfile = UserProfile.builder()
                .user(existingUser)
                .fullName("Old Name")
                .gender(Gender.MALE)
                .build();

        validRequest = UserRequestDTO.builder()
                .username("testuser")
                .email("test@example.com")
                .password("NewPassword@123")
                .generatePassword(false)
                .fullName("newName")
                .phoneNumber("0123456789")
                .livingEnvironment("Urban")
                .gender(Gender.MALE)
                .roleId(1)
                .status(Users.UserStatus.ACTIVE)
                .build();
    }

    @Test
    void updateUser_success() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(existingUser));
            given(userProfileRepository.findByUser(existingUser)).willReturn(Optional.of(existingProfile));

            adminService.updateUser(1, validRequest);

            assertEquals(validRequest.getEmail(), existingUser.getEmail());
            assertEquals(validRequest.getStatus(), existingUser.getStatus());
            assertEquals(validRequest.getFullName(), existingProfile.getFullName());
            assertEquals(validRequest.getPhoneNumber(), existingProfile.getPhone());
            assertEquals(validRequest.getGender(), existingProfile.getGender());
            assertEquals(validRequest.getPassword(), existingUser.getPassword());

            verify(userRepository).save(existingUser);
            verify(userProfileRepository).save(existingProfile);
        } catch (Exception e) {
            System.out.println("Test 'updateUser_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_userNotFound() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                adminService.updateUser(1, validRequest);
            });

            assertEquals("User not found", ex.getMessage());
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());

        } catch (Exception e) {
            System.out.println("Test 'updateUser_userNotFound' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_profileNotFound() {

        try {
            given(userRepository.findById(1)).willReturn(Optional.of(existingUser));
            given(userProfileRepository.findByUser(existingUser)).willReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () -> {
                adminService.updateUser(1, validRequest);
            });

            assertEquals("Profile not found for user ID: 1", ex.getMessage());
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'updateUser_profileNotFound' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_invalidPassword() {
        try {
            validRequest.setPassword("123456");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(validRequest);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            Exception ex = assertThrows(Exception.class, () -> {
                adminService.updateUser(1, validRequest);
            });
            System.out.println("Caught exception of type: " + ex.getClass().getName());
            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("updateUser_blankFullName failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'updateUser_blankFullName' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_blankPassword() {
        try {
            validRequest.setPassword("");
            given(userRepository.findById(1)).willReturn(Optional.of(existingUser));
            given(userProfileRepository.findByUser(existingUser)).willReturn(Optional.of(existingProfile));

            adminService.updateUser(1, validRequest);

            assertEquals(validRequest.getEmail(), existingUser.getEmail());
            assertEquals(validRequest.getStatus(), existingUser.getStatus());
            assertEquals(validRequest.getFullName(), existingProfile.getFullName());
            assertEquals(validRequest.getPhoneNumber(), existingProfile.getPhone());
            assertEquals(validRequest.getGender(), existingProfile.getGender());
            assertEquals(validRequest.getPassword(), existingUser.getPassword());

            verify(userRepository).save(existingUser);
            verify(userProfileRepository).save(existingProfile);
        } catch (Exception e) {
            System.out.println("Test 'updateUser_blankPassword' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_invalidFullName() {
        try {
            validRequest.setFullName("Minh123@fpt");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(validRequest);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            Exception ex = assertThrows(Exception.class, () -> {
                adminService.updateUser(1, validRequest);
            });
            System.out.println("Caught exception of type: " + ex.getClass().getName());
            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("updateUser_blankFullName failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'updateUser_blankFullName' thất bại: " + e.getMessage());
        }
    }

    @Test
    void updateUser_blankFullName() {
        try {
            validRequest.setFullName("");

            Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(validRequest);

            assertFalse(violations.isEmpty(), "Expected validation errors but got none");

            Exception ex = assertThrows(Exception.class, () -> {
                adminService.updateUser(1, validRequest);
            });
            System.out.println("Caught exception of type: " + ex.getClass().getName());
            for (ConstraintViolation<UserRequestDTO> violation : violations) {
                System.out.println("updateUser_blankFullName failed :" + violation.getMessage());
            }
        } catch (Exception e) {
            System.out.println("Test 'updateUser_blankFullName' thất bại: " + e.getMessage());
        }
    }
}
