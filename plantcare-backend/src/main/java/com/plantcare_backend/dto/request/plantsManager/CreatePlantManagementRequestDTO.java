package com.plantcare_backend.dto.request.plantsManager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePlantManagementRequestDTO {

    @NotBlank(message = "scientificName must not blank")
    private String scientificName;
    @NotBlank(message = "commonName must not blank")
    private String commonName;
    @NotNull(message = "categoryId must not null")
    private String categoryId;
    @NotBlank(message = "description must not blank")
    private String description;
    @NotBlank(message = "careInstructions must not blank")
    private String careInstructions;
    @NotBlank(message = "lightRequirement must not blank")
    private String lightRequirement;
    @NotBlank(message = "waterRequirement must not blank")
    private String waterRequirement;
    @NotBlank(message = "careDifficulty must not blank")
    private String careDifficulty;
    @NotBlank(message = "suitableLocation must not blank")
    private String suitableLocation;
    @NotBlank(message = "commonDiseases must not blank")
    private String commonDiseases;
}
