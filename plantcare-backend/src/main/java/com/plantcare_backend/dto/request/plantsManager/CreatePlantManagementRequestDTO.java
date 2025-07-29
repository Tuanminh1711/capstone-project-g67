package com.plantcare_backend.dto.request.plantsManager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreatePlantManagementRequestDTO {

    @NotBlank(message = "scientificName must not blank")
    private String scientificName;
    @NotBlank(message = "commonName must not blank")
    private String commonName;
    @NotNull(message = "categoryId must not null")
    private String categoryId;
    @NotBlank(message = "description must not blank")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    @NotBlank(message = "careInstructions must not blank")
    private String careInstructions;
    @NotBlank(message = "lightRequirement must not blank")
    private String lightRequirement;
    @NotBlank(message = "waterRequirement must not blank")
    private String waterRequirement;
    @NotBlank(message = "careDifficulty must not blank")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String careDifficulty;
    @NotBlank(message = "suitableLocation must not blank")
    private String suitableLocation;
    @NotBlank(message = "commonDiseases must not blank")
    @Size(max = 300, message = "Description must not exceed 300 characters")
    private String commonDiseases;
    @NotNull(message = "image not null")
    private List<String> imageUrls;
}
