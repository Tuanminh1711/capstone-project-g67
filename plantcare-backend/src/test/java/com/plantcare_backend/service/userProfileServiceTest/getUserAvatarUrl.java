package com.plantcare_backend.service.userProfileServiceTest;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.UserProfileServiceImpl; // đổi import nếu khác
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
class GetUserAvatarUrlTest {

    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private Integer userId;
    private Users user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        userId = 321;

        user = new Users();
        user.setId(userId);
        user.setUsername("tester");
        user.setEmail("tester@example.com");

        profile = new UserProfile();
        profile.setProfileId(1);
        profile.setUser(user);
        profile.setAvatarUrl("/api/avatars/abc.png");
    }

    @Test
    void getUserAvatarUrl_shouldReturnUrl_whenFound() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        // when
        String url = userProfileService.getUserAvatarUrl(userId);

        // then
        assertNotNull(url);
        assertEquals("/api/avatars/abc.png", url);

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verifyNoMoreInteractions(userRepository, userProfileRepository);

        System.out.println("✅ getUserAvatarUrl_shouldReturnUrl_whenFound: PASSED");
    }

    @Test
    void getUserAvatarUrl_shouldThrow_whenUserNotFound() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.getUserAvatarUrl(userId));
        assertTrue(ex.getMessage().contains("User not found"));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, never()).findByUser(any());
        verifyNoMoreInteractions(userRepository, userProfileRepository);

        System.out.println("✅ getUserAvatarUrl_shouldThrow_whenUserNotFound: PASSED");
    }

    @Test
    void getUserAvatarUrl_shouldThrow_whenProfileNotFound() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.getUserAvatarUrl(userId));
        assertTrue(ex.getMessage().contains("Profile not found"));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verifyNoMoreInteractions(userRepository, userProfileRepository);

        System.out.println("✅ getUserAvatarUrl_shouldThrow_whenProfileNotFound: PASSED");
    }

    @Test
    void getUserAvatarUrl_shouldThrow_whenUserIdNull() {
        // Tùy config, Spring Data thường ném IllegalArgumentException: "The given id must not be null!"
        when(userRepository.findById(null))
                .thenThrow(new IllegalArgumentException("The given id must not be null!"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.getUserAvatarUrl(null));
        assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));

        verify(userRepository, times(1)).findById(null);
        verify(userProfileRepository, never()).findByUser(any());
        verifyNoMoreInteractions(userRepository, userProfileRepository);

        System.out.println("✅ getUserAvatarUrl_shouldThrow_whenUserIdNull: PASSED");
    }
}
