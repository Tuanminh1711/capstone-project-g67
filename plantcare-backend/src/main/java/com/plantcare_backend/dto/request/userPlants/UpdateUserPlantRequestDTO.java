package com.plantcare_backend.dto.request.userPlants;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    // Image update options
    private List<UserPlantImageUpdateDTO> imageUpdates; // Flexible image updates
    private List<String> imageUrls; // Legacy: replace all images
}