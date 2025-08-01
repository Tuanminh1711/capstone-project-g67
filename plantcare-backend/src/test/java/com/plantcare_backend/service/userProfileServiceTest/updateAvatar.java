package com.plantcare_backend.service.userProfileServiceTest;

import com.plantcare_backend.dto.response.auth.UpdateAvatarResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.UserProfileServiceImpl; // đổi import nếu khác
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateAvatarTest {

    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private Integer userId;
    private Users user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        userId = 123;

        user = new Users();
        user.setId(userId);
        user.setUsername("dungna");
        user.setEmail("dung@example.com");

        profile = new UserProfile();
        profile.setProfileId(1);
        profile.setUser(user);
        profile.setAvatarUrl(null); // chưa có avatar cũ
    }

    @Test
    void updateAvatar_success_shouldStoreFileUpdateProfileAndReturnUrl() throws Exception {
        // given
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatar.getContentType()).thenReturn("image/png");
        when(avatar.getSize()).thenReturn(12_345L);
        when(avatar.getOriginalFilename()).thenReturn("my-avatar.png");
        byte[] bytes = "img".getBytes();
        InputStream is = new ByteArrayInputStream(bytes);
        when(avatar.getInputStream()).thenReturn(is);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // mock static Files.* để không đụng IO thật
        try (MockedStatic<Files> files = mockStatic(Files.class)) {
            Path mockUploadPath = Paths.get("uploads"); // giá trị cụ thể không quan trọng vì đã mock Files
            files.when(() -> Files.exists(any(Path.class))).thenReturn(true); // thư mục đã tồn tại
            files.when(() -> Files.copy(any(InputStream.class), any(Path.class))).thenReturn(1L);

            // when
            UpdateAvatarResponseDTO res = userProfileService.updateAvatar(userId, avatar);

            // then
            assertNotNull(res);
            assertEquals("Avatar updated successfully", res.getMessage());
            assertNotNull(res.getAvatarUrl());
            assertTrue(res.getAvatarUrl().startsWith("/api/avatars/"));
            assertTrue(res.getAvatarUrl().endsWith(".png")); // đuôi theo original filename

            ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
            verify(userProfileRepository, times(1)).save(captor.capture());
            UserProfile saved = captor.getValue();
            assertEquals(res.getAvatarUrl(), saved.getAvatarUrl());

            verify(userRepository, times(1)).findById(userId);
            verify(userProfileRepository, times(1)).findByUser(user);
            System.out.println("✅ updateAvatar_success_shouldStoreFileUpdateProfileAndReturnUrl: PASSED");
        }
    }

    @Test
    void updateAvatar_shouldThrow_whenUserNotFound() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.updateAvatar(userId, avatar));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, never()).findByUser(any());
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenUserNotFound: PASSED");
    }

    @Test
    void updateAvatar_shouldThrow_whenProfileNotFound() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.updateAvatar(userId, avatar));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenProfileNotFound: PASSED");
    }

    @Test
    void updateAvatar_shouldThrow_whenAvatarNull() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateAvatar(userId, null));
        assertEquals("Avatar file cannot be empty", ex.getMessage());

        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenAvatarNull: PASSED");
    }

    @Test
    void updateAvatar_shouldThrow_whenAvatarEmpty() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateAvatar(userId, avatar));
        assertEquals("Avatar file cannot be empty", ex.getMessage());

        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenAvatarEmpty: PASSED");
    }

    @Test
    void updateAvatar_shouldThrow_whenContentTypeNullOrNotImage() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatar.getContentType()).thenReturn(null);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateAvatar(userId, avatar));
        assertEquals("File must be an image", ex1.getMessage());

        // not image/*
        reset(avatar);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatar.getContentType()).thenReturn("application/pdf");

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateAvatar(userId, avatar));
        assertEquals("File must be an image", ex2.getMessage());

        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenContentTypeNullOrNotImage: PASSED");
    }

    @Test
    void updateAvatar_shouldThrow_whenFileTooLarge() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatar.getContentType()).thenReturn("image/jpeg");
        when(avatar.getSize()).thenReturn(6_000_000L); // > 5MB

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateAvatar(userId, avatar));
        assertEquals("File size must be less than 5MB", ex.getMessage());

        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateAvatar_shouldThrow_whenFileTooLarge: PASSED");
    }

    @Test
    void updateAvatar_shouldWrapIOException_whenSavingFails() throws Exception {
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatar.getContentType()).thenReturn("image/png");
        when(avatar.getSize()).thenReturn(1024L);
        when(avatar.getOriginalFilename()).thenReturn("pic.png");
        when(avatar.getInputStream()).thenReturn(new ByteArrayInputStream("x".getBytes()));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        try (MockedStatic<Files> files = mockStatic(Files.class)) {
            files.when(() -> Files.exists(any(Path.class))).thenReturn(true);
            files.when(() -> Files.copy(any(InputStream.class), any(Path.class)))
                    .thenThrow(new IOException("disk error"));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userProfileService.updateAvatar(userId, avatar));
            assertTrue(ex.getMessage().contains("Failed to save avatar file"));

            verify(userProfileRepository, never()).save(any());
            System.out.println("✅ updateAvatar_shouldWrapIOException_whenSavingFails: PASSED");
        }
    }
}
