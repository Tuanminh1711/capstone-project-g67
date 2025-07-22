package com.plantcare_backend.dto.request.userPlants;

import com.plantcare_backend.model.Plants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class CreateUserPlantRequestDTO {
    @NotBlank(message = "scientificName must not blank")
    @Size(min = 3, max = 100, message = "scientificName 3 to 100 characters")
    private String scientificName;

    @NotBlank(message = "commonName must not blank")
    @Size(min = 2, max = 100, message = "commonName 2 to 100 characters")
    private String commonName;

    @NotNull(message = "categoryID must not null")
    private String categoryId;

    @Size(min = 25, max = 2000, message = "description 25 to 2000 characters")
    private String description;

    @NotNull(message = "careInstructions must not null")
    private String careInstructions;

    @NotNull(message = "lightRequirement must no null")
    private Plants.LightRequirement lightRequirement;

    @NotNull(message = "waterRequirement must not null")
    private Plants.WaterRequirement waterRequirement;

    @NotNull(message = "careDifficulty must not null")
    private Plants.CareDifficulty careDifficulty;

    @Size(max = 500, message = "suitableLocation must not null")
    private String suitableLocation;

    @Size(max = 1000, message = "commonDiseases max 1000 characters")
    private String commonDiseases;

    private List<String> imageUrls;
}
