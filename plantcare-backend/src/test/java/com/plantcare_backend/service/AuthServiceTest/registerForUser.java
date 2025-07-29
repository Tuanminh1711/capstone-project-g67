package com.plantcare_backend.service.AuthServiceTest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.OtpService;
import com.plantcare_backend.service.impl.AuthServiceImpl;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.AssertionsKt.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class registerForUser {

    @InjectMocks
    private AuthServiceImpl authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private RegisterRequestDTO request;

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private void printResponse(ResponseData response) throws JsonProcessingException {
        System.out.println("LoginForUserResponse:\n" + mapper.writeValueAsString(response));
    }

    @BeforeEach
    void setUp() {
        request = new RegisterRequestDTO();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setConfirmPassword("password123");
        request.setFullName("Test User");
        request.setPhone("0123456789");
    }

    @Test
    void registerForUser_success() {
        try {
            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

            Role mockRole = new Role();
            mockRole.setRoleName(Role.RoleName.USER);
            when(roleRepository.findByRoleName(Role.RoleName.USER)).thenReturn(Optional.of(mockRole));

            Users savedUser = new Users();
            savedUser.setId(1);
            savedUser.setUsername("testuser");
            savedUser.setEmail("test@example.com");
            savedUser.setRole(mockRole);

            when(userRepository.save(any(Users.class))).thenReturn(savedUser);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.CREATED.value(), response.getStatus());
            assertTrue(response.getMessage().contains("đăng ký thành công. vui lòng kiểm tra email để xác thực tài khoản "));
            assertNotNull(response.getData());

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_success' thất bại");
        }
    }

    @Test
    void registerForUser_usernameExists() {

        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        try {
            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu username đã tồn tại");
            assertEquals("Username already exists", response.getMessage(), "Username already exists");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'loginForUser_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'loginForUser_success' thất bại");
        }
    }

    @Test
    void registerForUser_emailExists() {
        try {
            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu email đã tồn tại");
            assertEquals("Email already exists", response.getMessage(), "Email already exists");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_emailExists' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_emailExists' thất bại");
        }
    }

    @Test
    void registerForUser_phoneNumberExists() {
        try {
            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
            when(userProfileRepository.existsByPhone("0123456789")).thenReturn(true);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu số điện thoại đã tồn tại");
            assertEquals("Phone already exists", response.getMessage(), "Phone already exists");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_phoneNumberExists' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_phoneNumberExists' thất bại");
        }
    }

    @Test
    void registerForUser_invalidEmailFormat() {
        try {
            request.setEmail("invalid-email");

            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("invalid-email")).thenReturn(false);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
            assertEquals("Email không hợp lệ", response.getMessage());

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_invalidEmailFormat' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_invalidEmailFormat' thất bại");
        }
    }

    @Test
    void registerForUser_passwordTooShort() {
        request.setPassword("123");
        request.setConfirmPassword("123");

        try {
            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("invalid-email")).thenReturn(false);


            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu mật khẩu quá ngắn");
            assertEquals("Invalid password", response.getMessage(),
                    "Invalid password");
            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_passwordTooShort' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_passwordTooShort' thất bại");
        }
    }


    @Test
    void registerForUser_passwordMismatch() {
        try {
            request.setConfirmPassword("wrongPassword");

            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu mật khẩu không khớp");
            assertEquals("Password and confirm password do not match", response.getMessage(),
                    "Password and confirm password do not match");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_passwordMismatch' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_passwordMismatch' thất bại");
        }
    }

    @Test
    void registerForUser_roleNotFound() {
        try {
            when(roleRepository.findByRoleName(Role.RoleName.USER)).thenReturn(Optional.empty());

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatus(),
                    "Status code phải là 500 INTERNAL_SERVER_ERROR nếu không tìm thấy role");
            assertTrue(response.getMessage().contains("Default role not found"));

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_roleNotFound' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_roleNotFound' thất bại");
        }
    }

    @Test
    void registerForUser_invalidFullName() {
        try {
            request.setFullName("John123@!");

            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu fullname không hợp lệ");
            assertEquals("Fullname không được chứa ký tự đặc biệt hoặc số", response.getMessage(),
                    "Fullname không được chứa ký tự đặc biệt hoặc số");

            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_invalidFullName' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_invalidFullName' thất bại");
        }
    }

    @Test
    void registerForUser_invalidPhoneNumber() {
        try {
            request.setPhone("123ABC@#");

            when(userRepository.existsByUsername("testuser")).thenReturn(false);
            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

            ResponseData<?> response = authService.registerForUser(request);

            assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus(),
                    "Status code phải là 400 BAD_REQUEST nếu số điện thoại không hợp lệ");
            assertEquals("Số điện thoại không hợp lệ", response.getMessage(),
                    "Số điện thoại không hợp lệ");

            printResponse(response); // In ra toàn bộ response để debug nếu fail
        } catch (Exception e) {
            System.out.println("Test 'registerForUser_invalidPhoneNumber' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'registerForUser_invalidPhoneNumber' thất bại");
        }

    }
}