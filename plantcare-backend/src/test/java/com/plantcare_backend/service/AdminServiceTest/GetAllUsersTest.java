package com.plantcare_backend.service.AdminServiceTest;

import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.AdminServiceImpl;
import com.plantcare_backend.util.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class GetAllUsersTest {
    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private Users user1;
    private Users user2;

    private UserProfile profile1;
    private UserProfile profile2;

    Page<Users> usersPage;

    @BeforeEach
    void setup() {
        Role role = Role.builder().id(1).roleName(Role.RoleName.USER).build();

        user1 = Users.builder()
                .id(1).username("user1")
                .email("user1@example.com")
                .status(Users.UserStatus.ACTIVE)
                .role(role)
                .build();

        user2 = Users.builder()
                .id(2)
                .username("user2")
                .email("user2@example.com")
                .status(Users.UserStatus.BANNED)
                .role(role)
                .build();

        profile1 = UserProfile.builder()
                .user(user1)
                .fullName("Nguyễn Văn A")
                .phone("0123456789")
                .gender(Gender.MALE)
                .avatarUrl("url1")
                .livingEnvironment("Urban")
                .build();

        profile2 = UserProfile.builder()
                .user(user2).fullName("Trần Thị B")
                .phone("0987654321")
                .gender(Gender.FEMALE)
                .avatarUrl("url2")
                .livingEnvironment("Rural")
                .build();

        List<Users> users = List.of(user1, user2);
        usersPage = new PageImpl<>(users);
    }

    @Test
    void getAllUsers_success() {
        try {
            given(userRepository.findAll(PageRequest.of(0, 10))).willReturn(usersPage);
            given(userProfileRepository.findByUser(user1)).willReturn(Optional.of(profile1));
            given(userProfileRepository.findByUser(user2)).willReturn(Optional.of(profile2));

            List<UserDetailResponse> responses = adminService.getAllUsers(0, 10);

            assertEquals(2, responses.size());

            UserDetailResponse response1 = responses.get(0);
            assertEquals(user1.getUsername(), response1.getUsername());
            assertEquals(profile1.getFullName(), response1.getFullName());
            assertEquals(profile1.getGender(), response1.getGender());

            UserDetailResponse response2 = responses.get(1);
            assertEquals(user2.getUsername(), response2.getUsername());
            assertEquals(profile2.getFullName(), response2.getFullName());
            assertEquals(profile2.getGender(), response2.getGender());

            verify(userRepository).findAll(PageRequest.of(0, 10));
            verify(userProfileRepository).findByUser(user1);
            verify(userProfileRepository).findByUser(user2);

            for (UserDetailResponse response : responses) {
                System.out.println(response);
            }
            System.out.println("Test 'getAllUsers_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllUsers_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllUsers_success_EmptyList() {
        try {
            Page<Users> emptyPage = new PageImpl<>(Collections.emptyList());
            given(userRepository.findAll(PageRequest.of(0, 10))).willReturn(emptyPage);

            List<UserDetailResponse> responses = adminService.getAllUsers(0, 10);
            assertNotNull(responses);
            assertTrue(responses.isEmpty(), "Danh sách trả về phải rỗng khi không có user nào");

            System.out.println("Test 'getAllUsers_success_EmptyList' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllUsers_success_EmptyList' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllUsers_withNegativePageNo() {
        try {
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                adminService.getAllUsers(-1, 10);
            });

            assertTrue(exception.getMessage().contains("Page index must not be less than zero"));
            System.out.println("Test 'getAllUsers_withNegativePageNo_shouldThrowException' thành công");
            System.out.println(exception.getClass().getSimpleName());
        } catch (Exception e) {
            System.out.println("Test 'getAllUsers_withNegativePageNo' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllUsers_withNegativePageSize() {
        try {
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                adminService.getAllUsers(0, -10);
            });

            assertTrue(exception.getMessage().contains("Page size must not be less than one"));
            System.out.println("Test 'getAllUsers_withNegativePageSize' thành công");
            System.out.println(exception.getClass().getSimpleName());
        } catch (Exception e) {
            System.out.println("Test 'getAllUsers_withNegativePageSize' thất bại: " + e.getMessage());
        }
    }

    @Test
    void getAllUsers_withExcessivePageSize() {
        int veryLargePageSize = 10_000;
        Page<Users> usersPage = new PageImpl<>(List.of(user1));
        given(userRepository.findAll(PageRequest.of(0, veryLargePageSize))).willReturn(usersPage);
        given(userProfileRepository.findByUser(user1)).willReturn(Optional.of(profile1));

        List<UserDetailResponse> responses = adminService.getAllUsers(0, veryLargePageSize);

        assertEquals(1, responses.size());
    }


}
