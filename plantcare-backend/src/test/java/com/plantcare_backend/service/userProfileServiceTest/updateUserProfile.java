package com.plantcare_backend.service.userProfileServiceTest;

import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.UserProfileServiceImpl; // đổi import nếu khác
import com.plantcare_backend.util.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Test cho updateUserProfile(userId, dto)
 */
@ExtendWith(MockitoExtension.class)
class UpdateUserProfileTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private Integer userId;
    private Users user;
    private UserProfile existingProfile;

    private UserProfileRequestDTO req; // DTO đầu vào

    @BeforeEach
    void setUp() {
        userId = 123;

        // Users (entity)
        user = new Users();
        user.setId(userId);
        user.setUsername("dungna");
        user.setEmail("dung@example.com");

        // UserProfile (entity)
        existingProfile = new UserProfile();
        existingProfile.setProfileId(1);
        existingProfile.setUser(user);
        existingProfile.setFullName("Old Name");
        existingProfile.setPhone("+84123456789");
        existingProfile.setLivingEnvironment("Old Env");

        try {
            Class<?> genderClass = existingProfile.getClass().getDeclaredField("gender").getType();
            Object female = Enum.valueOf((Class<Enum>) genderClass.asSubclass(Enum.class), "FEMALE");
            existingProfile.setGender(Gender.FEMALE);
        } catch (Exception ignored) {}

        // DTO (input)
        req = new UserProfileRequestDTO();
        req.setFullName("Nguyễn Anh Dũng");
        req.setPhoneNumber("+84987654321");
        req.setLivingEnvironment("Apartment");
        req.setGender("MALE"); // hợp lệ
    }

    @Test
    void updateUserProfile_shouldUpdateFieldsAndReturnDTO_whenValidInput_withValidGender() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // when
        UserProfileRequestDTO dto = userProfileService.updateUserProfile(userId, req);

        // then
        ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, times(1)).save(profileCaptor.capture());

        UserProfile saved = profileCaptor.getValue();
        assertSame(existingProfile, saved); // cập nhật trên entity có sẵn
        assertEquals("Nguyễn Anh Dũng", saved.getFullName());
        assertEquals("+84987654321", saved.getPhone());
        assertEquals("Apartment", saved.getLivingEnvironment());
        // gender được set theo valueOf("MALE")
        assertEquals("MALE", saved.getGender().toString());

        // DTO trả về (convertToDTO) – kiểm tra các trường chính
        assertNotNull(dto);
        assertEquals("Nguyễn Anh Dũng", dto.getFullName());
        assertEquals("+84987654321", dto.getPhoneNumber());
        assertEquals("Apartment", dto.getLivingEnvironment());
        assertEquals("MALE", dto.getGender());

        verifyNoMoreInteractions(userRepository, userProfileRepository);
        System.out.println("✅ updateUserProfile_shouldUpdateFieldsAndReturnDTO_whenValidInput_withValidGender: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenUserNotFound() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertTrue(ex.getMessage().contains("User not found"));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, never()).findByUser(any());
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateUserProfile_shouldThrow_whenUserNotFound: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenProfileNotFound() {
        // given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        // when + then
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertTrue(ex.getMessage().contains("Profile not found"));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateUserProfile_shouldThrow_whenProfileNotFound: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenFullNameBlank() {
        // given
        req.setFullName("  ");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertEquals("Full name cannot be empty", ex.getMessage());

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateUserProfile_shouldThrow_whenFullNameBlank: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenFullNameNull() {
        // given
        req.setFullName(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertEquals("Full name cannot be empty", ex.getMessage());

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateUserProfile_shouldThrow_whenFullNameNull: PASSED");
    }

    @Test
    void updateUserProfile_shouldKeepExistingGender_whenDtoGenderNull() {
        // given: DTO không gửi gender
        req.setGender(null);

        // giả sử gender hiện tại là FEMALE (đã set ở setUp bằng reflection phía trên)
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // when
        UserProfileRequestDTO dto = userProfileService.updateUserProfile(userId, req);

        // then
        ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository, times(1)).save(profileCaptor.capture());
        UserProfile saved = profileCaptor.getValue();

        // gender giữ nguyên
        assertNotNull(saved.getGender());
        // không đổi vì DTO null
        assertEquals(saved.getGender().toString(), existingProfile.getGender().toString());

        // các trường khác đã cập nhật
        assertEquals("Nguyễn Anh Dũng", saved.getFullName());
        assertEquals("+84987654321", saved.getPhone());
        assertEquals("Apartment", saved.getLivingEnvironment());

        // DTO trả về phản ánh giá trị đã cập nhật
        assertEquals("Nguyễn Anh Dũng", dto.getFullName());
        assertEquals("+84987654321", dto.getPhoneNumber());
        assertEquals("Apartment", dto.getLivingEnvironment());

        System.out.println("✅ updateUserProfile_shouldKeepExistingGender_whenDtoGenderNull: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenGenderInvalid() {
        // given
        req.setGender("UNKNOWN"); // không trùng enum
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertTrue(ex.getMessage().contains("Invalid gender value"));

        verify(userRepository, times(1)).findById(userId);
        verify(userProfileRepository, times(1)).findByUser(user);
        verify(userProfileRepository, never()).save(any());

        System.out.println("✅ updateUserProfile_shouldThrow_whenGenderInvalid: PASSED");
    }

    @Test
    void updateUserProfile_shouldThrow_whenLivingEnvironmentBlank() {
        // given
        req.setLivingEnvironment("");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));

        // when + then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userProfileService.updateUserProfile(userId, req));
        assertEquals("Living environment cannot be empty", ex.getMessage());

        verify(userProfileRepository, never()).save(any());
        System.out.println("✅ updateUserProfile_shouldThrow_whenLivingEnvironmentBlank: PASSED");
    }
}
