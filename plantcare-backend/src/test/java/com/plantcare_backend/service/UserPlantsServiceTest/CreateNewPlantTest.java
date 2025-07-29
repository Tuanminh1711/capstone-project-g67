package com.plantcare_backend.service.UserPlantsServiceTest;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantResponseDTO;
import com.plantcare_backend.dto.validator.UserPlantValidator;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.PlantCategoryRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.impl.UserPlantsServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateNewPlantTest {

    @Mock private PlantRepository plantRepository;
    @Mock private PlantCategoryRepository plantCategoryRepository;
    @Mock private UserPlantRepository userPlantRepository;
    @Mock private UserPlantValidator userPlantValidator; // validateUserPlant(request, userId)

    @InjectMocks
    private UserPlantsServiceImpl userPlantsService;

    private Long userId;
    private CreateUserPlantRequestDTO req;
    private PlantCategory cat;

    @BeforeEach
    void setUp() {
        userId = 777L;

        req = new CreateUserPlantRequestDTO();
        req.setScientificName("Epipremnum aureum");
        req.setCommonName("Golden Pothos");
        req.setCategoryId("5"); // là String trong DTO
        req.setDescription("Very popular indoor vine with heart-shaped leaves.");
        req.setCareInstructions("Water when topsoil is dry; bright, indirect light.");
        req.setLightRequirement(Plants.LightRequirement.MEDIUM);
        req.setWaterRequirement(Plants.WaterRequirement.MEDIUM);
        req.setCareDifficulty(Plants.CareDifficulty.EASY);
        req.setSuitableLocation("Living room");
        req.setCommonDiseases("Root rot");
        req.setImageUrls(Arrays.asList("https://cdn/img1.jpg", "https://cdn/img2.jpg"));

        cat = new PlantCategory();
        cat.setId(5L);
        cat.setName("Indoor");
    }

    @Test
    void createNewPlant_success_withImages_shouldCreatePlantAndAddToUserCollection() {
        // validator OK
        doNothing().when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        // category OK
        when(plantCategoryRepository.findById(5L)).thenReturn(Optional.of(cat));

        // plant save -> trả về plant có id
        when(plantRepository.save(any(Plants.class))).thenAnswer(inv -> {
            Plants p = inv.getArgument(0);
            p.setId(100L);
            return p;
        });

        // user plant save -> trả về đúng object
        when(userPlantRepository.save(any(UserPlants.class))).thenAnswer(inv -> inv.getArgument(0));

        // when
        UserPlantResponseDTO dto = userPlantsService.createNewPlant(req, userId);

        // then: validator & category
        verify(userPlantValidator, times(1)).validateUserPlant(eq(req), eq(userId));
        verify(plantCategoryRepository, times(1)).findById(5L);

        // capture Plants được lưu
        ArgumentCaptor<Plants> plantCaptor = ArgumentCaptor.forClass(Plants.class);
        verify(plantRepository, times(1)).save(plantCaptor.capture());
        Plants savedPlant = plantCaptor.getValue();

        assertEquals("Epipremnum aureum", savedPlant.getScientificName());
        assertEquals("Golden Pothos", savedPlant.getCommonName());
        assertSame(cat, savedPlant.getCategory());
        assertEquals("Very popular indoor vine with heart-shaped leaves.", savedPlant.getDescription());
        assertEquals("Water when topsoil is dry; bright, indirect light.", savedPlant.getCareInstructions());
        assertEquals(Plants.LightRequirement.MEDIUM, savedPlant.getLightRequirement());
        assertEquals(Plants.WaterRequirement.MEDIUM, savedPlant.getWaterRequirement());
        assertEquals(Plants.CareDifficulty.EASY, savedPlant.getCareDifficulty());
        assertEquals("Living room", savedPlant.getSuitableLocation());
        assertEquals("Root rot", savedPlant.getCommonDiseases());
        assertEquals(Plants.PlantStatus.ACTIVE, savedPlant.getStatus());
        assertEquals(userId, savedPlant.getCreatedBy());

        // capture UserPlants được lưu
        ArgumentCaptor<UserPlants> userPlantCaptor = ArgumentCaptor.forClass(UserPlants.class);
        verify(userPlantRepository, times(1)).save(userPlantCaptor.capture());
        UserPlants insertedUserPlant = userPlantCaptor.getValue();

        assertEquals(userId, insertedUserPlant.getUserId());
        assertEquals(100L, insertedUserPlant.getPlantId()); // lấy từ savedPlant
        assertEquals("Golden Pothos", insertedUserPlant.getPlantName()); // default nickname
        assertEquals("Default location", insertedUserPlant.getPlantLocation());
        assertNotNull(insertedUserPlant.getPlantDate());
        assertNotNull(insertedUserPlant.getCreated_at());

        // trả về DTO (không biết mapper bên trong), chỉ cần không null
        assertNotNull(dto);

        // không có repo khác được gọi
        verifyNoMoreInteractions(plantRepository, plantCategoryRepository, userPlantRepository, userPlantValidator);

        System.out.println("✅ createNewPlant_success_withImages_shouldCreatePlantAndAddToUserCollection: PASSED");
    }

    @Test
    void createNewPlant_success_withoutImages_shouldStillCreate() {
        // images = null
        req.setImageUrls(null);

        doNothing().when(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        when(plantCategoryRepository.findById(5L)).thenReturn(Optional.of(cat));
        when(plantRepository.save(any(Plants.class))).thenAnswer(inv -> {
            Plants p = inv.getArgument(0);
            p.setId(101L);
            return p;
        });
        when(userPlantRepository.save(any(UserPlants.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPlantResponseDTO dto = userPlantsService.createNewPlant(req, userId);

        assertNotNull(dto);
        verify(plantRepository, times(1)).save(any(Plants.class));
        verify(userPlantRepository, times(1)).save(any(UserPlants.class));
        verifyNoMoreInteractions(plantRepository, plantCategoryRepository, userPlantRepository, userPlantValidator);

        System.out.println("✅ createNewPlant_success_withoutImages_shouldStillCreate: PASSED");
    }

    @Test
    void createNewPlant_fail_whenValidationFails_shouldNotCallRepos() {
        // validator ném exception
        doThrow(new IllegalArgumentException("invalid request"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("invalid request", ex.getMessage());

        // không được gọi repos
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);
        verify(userPlantValidator, times(1)).validateUserPlant(eq(req), eq(userId));

        System.out.println("✅ createNewPlant_fail_whenValidationFails_shouldNotCallRepos: PASSED");
    }

    @Test
    void createNewPlant_fail_whenCategoryNotFound_shouldThrow() {
        doNothing().when(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        when(plantCategoryRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userPlantsService.createNewPlant(req, userId));

        verify(userPlantValidator, times(1)).validateUserPlant(eq(req), eq(userId));
        verify(plantCategoryRepository, times(1)).findById(5L);

        // Không save gì khi category không tồn tại
        verifyNoInteractions(plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_fail_whenCategoryNotFound_shouldThrow: PASSED");
    }

    @Test
    void createNewPlant_shouldPassCorrectCategoryIdParsing_fromString() {
        // kiểm tra parse Long.valueOf(request.getCategoryId())
        req.setCategoryId("123"); // đổi sang 123
        PlantCategory c123 = new PlantCategory();
        c123.setId(123L);
        c123.setName("C123");

        doNothing().when(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        when(plantCategoryRepository.findById(123L)).thenReturn(Optional.of(c123));
        when(plantRepository.save(any(Plants.class))).thenAnswer(inv -> {
            Plants p = inv.getArgument(0);
            p.setId(999L);
            return p;
        });
        when(userPlantRepository.save(any(UserPlants.class))).thenAnswer(inv -> inv.getArgument(0));

        userPlantsService.createNewPlant(req, userId);

        verify(plantCategoryRepository, times(1)).findById(123L);

        System.out.println("✅ createNewPlant_shouldPassCorrectCategoryIdParsing_fromString: PASSED");
    }
    @Test
    void createNewPlant_shouldThrow_whenRequestNull() {
        doThrow(new IllegalArgumentException("Request must not be null"))
                .when(userPlantValidator).validateUserPlant(isNull(), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(null, userId));
        assertEquals("Request must not be null", ex.getMessage());

        verify(userPlantValidator, times(1)).validateUserPlant(isNull(), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenRequestNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenUserIdNull() {
        doThrow(new IllegalArgumentException("UserId must not be null"))
                .when(userPlantValidator).validateUserPlant(eq(req), isNull());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, null));
        assertEquals("UserId must not be null", ex.getMessage());

        verify(userPlantValidator, times(1)).validateUserPlant(eq(req), isNull());
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenUserIdNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenScientificNameBlank() {
        req.setScientificName("   ");
        doThrow(new IllegalArgumentException("scientificName must not blank"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("scientificName must not blank", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenScientificNameBlank: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenCommonNameBlank() {
        req.setCommonName("  ");
        doThrow(new IllegalArgumentException("commonName must not blank"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("commonName must not blank", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenCommonNameBlank: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenCategoryIdNull() {
        req.setCategoryId(null);
        doThrow(new IllegalArgumentException("categoryID must not null"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("categoryID must not null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenCategoryIdNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenCareInstructionsNull() {
        req.setCareInstructions(null);
        doThrow(new IllegalArgumentException("careInstructions must not null"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("careInstructions must not null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenCareInstructionsNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenLightRequirementNull() {
        req.setLightRequirement(null);
        doThrow(new IllegalArgumentException("lightRequirement must no null"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("lightRequirement must no null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenLightRequirementNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenWaterRequirementNull() {
        req.setWaterRequirement(null);
        doThrow(new IllegalArgumentException("waterRequirement must not null"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("waterRequirement must not null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenWaterRequirementNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenCareDifficultyNull() {
        req.setCareDifficulty(null);
        doThrow(new IllegalArgumentException("careDifficulty must not null"))
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("careDifficulty must not null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenCareDifficultyNull: PASSED");
    }

    @Test
    void createNewPlant_shouldThrow_whenSuitableLocationTooLong() {
        // ví dụ validator check length > 500
        req.setSuitableLocation("x".repeat(501));
        doThrow(new IllegalArgumentException("suitableLocation must not null")) // message theo DTO của bạn
                .when(userPlantValidator).validateUserPlant(eq(req), eq(userId));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userPlantsService.createNewPlant(req, userId));
        assertEquals("suitableLocation must not null", ex.getMessage());

        verify(userPlantValidator).validateUserPlant(eq(req), eq(userId));
        verifyNoInteractions(plantCategoryRepository, plantRepository, userPlantRepository);

        System.out.println("✅ createNewPlant_shouldThrow_whenSuitableLocationTooLong: PASSED");
    }
}
