package com.plantcare_backend.service.AdminServiceTest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.UserActivityLog;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Fail.fail;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GetUserDetailTest {
    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityLogRepository userActivityLogRepository;


    @Mock
    private UserProfileRepository userProfileRepository;

    private Users user;

    private UserDetailResponse response;

    private UserProfile userProfile;

    private List<UserActivityLog> userActivityLogs;


    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private void printResponse(UserDetailResponse response) throws JsonProcessingException {
        System.out.println("LoginForUserResponse:\n" + mapper.writeValueAsString(response));
    }

    @BeforeEach
    void setup() {
        Role role = new Role();
        role.setRoleName(Role.RoleName.ADMIN);

        userActivityLogs = List.of(new UserActivityLog());
        userProfile = new UserProfile();
        user = new Users();

        user.setId(1);
        user.setUsername("admin");
        user.setRole(role);

        userProfile.setProfileId(1);

    }

    @Test
    void getUserDetail_success() {
        try {
            given(userRepository.findById(1)).willReturn(Optional.of(user));
            given(userProfileRepository.findByUser(user)).willReturn(Optional.of(userProfile));

            UserDetailResponse response = adminService.getUserDetail(1);

            assertNotNull(response);
            assertEquals(HttpStatus.OK.value(), response.getStatus(), "Status không phải 200 OK");

//            assertEquals("User not found", response.getMessage(), "Message không phải 'User not found'");
        } catch (Exception e) {
            System.out.println("Test 'getUserDetail_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'getUserDetail_success' thất bại");
        }
    }

    @Test
    void getUserDetail_userNotFound_shouldThrowException() {
        try {
            when(userRepository.findById(1)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                adminService.getUserDetail(1);
            });

            assertEquals("User not found", exception.getMessage(), "Message không phải 'User not found'");
            printResponse(response);
        } catch (Exception e) {
            System.out.println("Test 'getUserDetail_success' thất bại: " + e.getMessage());
            e.printStackTrace();
            fail("Test 'getUserDetail_success' thất bại");
        }
    }
}

