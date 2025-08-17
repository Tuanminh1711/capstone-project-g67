package com.plantcare_backend.dto.request.userPlants;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.sql.Timestamp;
import java.util.List;

@Data
public class UpdateUserPlantRequestDTO {
    @NotNull(message = "User plant ID is required")
    private Long userPlantId;

    @NotBlank(message = "Nickname cannot be empty")
    @Size(min = 1, max = 100, message = "Nickname must be between 1 and 100 characters")
    private String nickname;

    @NotNull(message = "Planting date is required")
    private Timestamp plantingDate;

    @NotBlank(message = "Location cannot be empty")
    @Size(min = 1, max = 200, message = "Location must be between 1 and 200 characters")
    private String locationInHouse;

    private boolean reminderEnabled;

    // Plant detail update fields (only for user-created plants)
    private Long categoryId;

    @Pattern(regexp = "^(EASY|MODERATE|DIFFICULT)$", message = "Care difficulty must be EASY, MODERATE, or DIFFICULT")
    private String careDifficulty; // EASY, MODERATE, DIFFICULT

    @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "Light requirement must be LOW, MEDIUM, or HIGH")
    private String lightRequirement; // LOW, MEDIUM, HIGH

    @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "Water requirement must be LOW, MEDIUM, or HIGH")
    private String waterRequirement; // LOW, MEDIUM, HIGH

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 1000, message = "Care instructions cannot exceed 1000 characters")
    private String careInstructions;

    @Size(max = 500, message = "Suitable location cannot exceed 500 characters")
    private String suitableLocation;

    @Size(max = 500, message = "Common diseases cannot exceed 500 characters")
    private String commonDiseases;

    // Image update options
    private List<UserPlantImageUpdateDTO> imageUpdates; // Flexible image updates
    private List<String> imageUrls; // Legacy: replace all images
}