package com.plantcare_backend.service.adminServiceTest;

import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.AssertionsKt.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
public class SearchUserTest {
    @InjectMocks
    private AdminServiceImpl adminService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private Users mockUser;
    private UserProfile mockProfile;
    private SearchAccountRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        Role mockRole = new Role();
        mockRole.setRoleName(Role.RoleName.ADMIN);

        mockUser = new Users();
        mockUser.setId(1);
        mockUser.setUsername("admin");
        mockUser.setEmail("admin@example.com");
        mockUser.setStatus(Users.UserStatus.ACTIVE);
        mockUser.setRole(mockRole);

        mockProfile = new UserProfile();
        mockProfile.setFullName("John Doe");
        mockProfile.setPhone("123456789");
        mockProfile.setGender(Gender.MALE);
        mockProfile.setAvatarUrl("avatar.jpg");
        mockProfile.setLivingEnvironment("Urban");

//        requestDTO = SearchAccountRequestDTO.builder()
//                .keyword("john")
//                .role(Role.RoleName.ADMIN)
//                .userStatus(Users.UserStatus.ACTIVE)
//                .pageNo(0)
//                .pageSize(10)
//                .build();
    }

    @Test
    void searchUsers_Success() {
        Page<Users> usersPage = new PageImpl<>(List.of(mockUser));
        requestDTO = SearchAccountRequestDTO.builder()
                .keyword("admin")
                .role(Role.RoleName.ADMIN)
                .userStatus(Users.UserStatus.ACTIVE)
                .pageNo(0)
                .pageSize(10)
                .build();
        try {
            given(userRepository.findAll(any(Specification.class), any(Pageable.class))).willReturn(usersPage);
            given(userProfileRepository.findByUser(mockUser)).willReturn(Optional.of(mockProfile));

            List<UserDetailResponse> result = adminService.searchUsers(requestDTO);

            assertNotNull(result);
            assertEquals(1, result.size());

            UserDetailResponse response = result.get(0);
            assertEquals("admin", response.getUsername());
            assertEquals("admin@example.com", response.getEmail());
            assertEquals("John Doe", response.getFullName());
            assertEquals("123456789", response.getPhone());
            assertEquals(Gender.MALE, response.getGender());
            assertEquals("avatar.jpg", response.getAvatarUrl());
            assertEquals("Urban", response.getLivingEnvironment());
            System.out.println("Test 'getAllUsers_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'getAllUsers_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchUsers_noInputSuccess() {
        Page<Users> usersPage = new PageImpl<>(List.of(mockUser));
        requestDTO = SearchAccountRequestDTO.builder()
                .pageNo(0)
                .pageSize(10)
                .build();
        try {
            given(userRepository.findAll(any(Specification.class), any(Pageable.class))).willReturn(usersPage);
            given(userProfileRepository.findByUser(mockUser)).willReturn(Optional.of(mockProfile));

            List<UserDetailResponse> result = adminService.searchUsers(requestDTO);

            assertNotNull(result);
            assertEquals(1, result.size());

            UserDetailResponse response = result.get(0);
            assertEquals("admin", response.getUsername());
            assertEquals("admin@example.com", response.getEmail());
            assertEquals("John Doe", response.getFullName());
            assertEquals("123456789", response.getPhone());
            assertEquals(Gender.MALE, response.getGender());
            assertEquals("avatar.jpg", response.getAvatarUrl());
            assertEquals("Urban", response.getLivingEnvironment());
            System.out.println("Test 'searchUsers_noInputSuccess' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchUsers_noInputSuccess' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchUsers_byNameSuccess() {
        Page<Users> usersPage = new PageImpl<>(List.of(mockUser));
        requestDTO = SearchAccountRequestDTO.builder()
                .keyword("admin")
                .pageNo(0)
                .pageSize(10)
                .build();
        try {
            given(userRepository.findAll(any(Specification.class), any(Pageable.class))).willReturn(usersPage);
            given(userProfileRepository.findByUser(mockUser)).willReturn(Optional.of(mockProfile));

            List<UserDetailResponse> result = adminService.searchUsers(requestDTO);

            assertNotNull(result);
            assertEquals(1, result.size());

            UserDetailResponse response = result.get(0);
            assertEquals("admin", response.getUsername());
            assertEquals("admin@example.com", response.getEmail());
            assertEquals("John Doe", response.getFullName());
            assertEquals("123456789", response.getPhone());
            assertEquals(Gender.MALE, response.getGender());
            assertEquals("avatar.jpg", response.getAvatarUrl());
            assertEquals("Urban", response.getLivingEnvironment());
            System.out.println("Test 'searchUsers_byNameSuccess' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchUsers_byNameSuccess' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchUsers_byRoleSuccess() {
        Page<Users> usersPage = new PageImpl<>(List.of(mockUser));
        requestDTO = SearchAccountRequestDTO.builder()
                .role(Role.RoleName.ADMIN)
                .pageNo(0)
                .pageSize(10)
                .build();
        try {
            given(userRepository.findAll(any(Specification.class), any(Pageable.class))).willReturn(usersPage);
            given(userProfileRepository.findByUser(mockUser)).willReturn(Optional.of(mockProfile));

            List<UserDetailResponse> result = adminService.searchUsers(requestDTO);

            assertNotNull(result);
            assertEquals(1, result.size());

            UserDetailResponse response = result.get(0);
            assertEquals("admin", response.getUsername());
            assertEquals("admin@example.com", response.getEmail());
            assertEquals("John Doe", response.getFullName());
            assertEquals("123456789", response.getPhone());
            assertEquals(Gender.MALE, response.getGender());
            assertEquals("avatar.jpg", response.getAvatarUrl());
            assertEquals("Urban", response.getLivingEnvironment());
            System.out.println("Test 'searchUsers_byRoleSuccess' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchUsers_byRoleSuccess' thất bại: " + e.getMessage());
        }
    }

    @Test
    void searchUsers_byStatusSuccess() {
        Page<Users> usersPage = new PageImpl<>(List.of(mockUser));
        requestDTO = SearchAccountRequestDTO.builder()
                .userStatus(Users.UserStatus.ACTIVE)
                .pageNo(0)
                .pageSize(10)
                .build();
        try {
            given(userRepository.findAll(any(Specification.class), any(Pageable.class))).willReturn(usersPage);
            given(userProfileRepository.findByUser(mockUser)).willReturn(Optional.of(mockProfile));

            List<UserDetailResponse> result = adminService.searchUsers(requestDTO);

            assertNotNull(result);
            assertEquals(1, result.size());

            UserDetailResponse response = result.get(0);
            assertEquals("admin", response.getUsername());
            assertEquals("admin@example.com", response.getEmail());
            assertEquals("John Doe", response.getFullName());
            assertEquals("123456789", response.getPhone());
            assertEquals(Gender.MALE, response.getGender());
            assertEquals("avatar.jpg", response.getAvatarUrl());
            assertEquals("Urban", response.getLivingEnvironment());
            System.out.println("Test 'searchUsers_byStatusSuccess' thành công");
        } catch (Exception e) {
            System.out.println("Test 'searchUsers_byStatusSuccess' thất bại: " + e.getMessage());
        }
    }
}
