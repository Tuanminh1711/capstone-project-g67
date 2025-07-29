package com.plantcare_backend.service.UserProfileServiceTest;

import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.service.impl.UserProfileServiceImpl; // đổi import nếu khác
import com.plantcare_backend.util.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetUserProfileTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private Integer userId;
    private Users user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        userId = 123;

        user = new Users();
        // Set các field người dùng khớp DTO
        user.setId(1); // nếu Users.id là Integer
        user.setUsername("dungna");
        user.setEmail("dung@example.com");

        profile = new UserProfile();
        profile.setProfileId(1);
        profile.setUser(user);
        profile.setFullName("Nguyễn Anh Dũng");
        profile.setLivingEnvironment("Apartment");
        profile.setPhone("+84123456789");
        profile.setGender(Gender.MALE);
        profile.setAvatarUrl("http://example.com/avatar.jpg");
    }

    @Test
    void getUserProfile_shouldReturnDTO_whenFound() {
        // given
        when(userProfileRepository.findUserProfileDetails(userId))
                .thenReturn(Optional.of(profile));

        // when
        UserProfileRequestDTO dto = userProfileService.getUserProfile(userId);

        // then
        assertNotNull(dto);
        assertEquals(profile.getProfileId(), dto.getId());
        assertEquals(user.getUsername(), dto.getUsername());
        assertEquals(user.getEmail(), dto.getEmail());
        assertEquals(profile.getFullName(), dto.getFullName());
        assertEquals(profile.getPhone(), dto.getPhoneNumber());
        assertEquals(profile.getGender(), Gender.valueOf(dto.getGender()));
        assertEquals(profile.getLivingEnvironment(), dto.getLivingEnvironment());
        assertEquals(profile.getAvatarUrl(), dto.getAvatar());

        verify(userProfileRepository, times(1)).findUserProfileDetails(userId);
        verifyNoMoreInteractions(userProfileRepository);

        System.out.println("✅ getUserProfile_shouldReturnDTO_whenFound: PASSED");
    }

    @Test
    void getUserProfile_shouldThrow_whenNotFound() {
        // given
        when(userProfileRepository.findUserProfileDetails(userId))
                .thenReturn(Optional.empty());

        // when + then
        assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.getUserProfile(userId));

        verify(userProfileRepository, times(1)).findUserProfileDetails(userId);
        verifyNoMoreInteractions(userProfileRepository);

        System.out.println("✅ getUserProfile_shouldThrow_whenNotFound: PASSED");
    }

    @Test
    void getUserProfile_shouldThrow_whenUserIdNull() {
        // Tùy vào repo của bạn: nhiều @Query sẽ ném IllegalArgumentException khi tham số null.
        // Stub cho rõ ràng hành vi mong muốn.
        when(userProfileRepository.findUserProfileDetails(null))
                .thenThrow(new IllegalArgumentException("userId must not be null"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.getUserProfile(null));
        assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));

        verify(userProfileRepository, times(1)).findUserProfileDetails(null);
        verifyNoMoreInteractions(userProfileRepository);

        System.out.println("✅ getUserProfile_shouldThrow_whenUserIdNull: PASSED");
    }
}
