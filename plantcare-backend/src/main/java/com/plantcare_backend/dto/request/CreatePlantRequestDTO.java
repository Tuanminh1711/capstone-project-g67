package com.plantcare_backend.dto.request;

import com.plantcare_backend.model.Plants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * created by tahoang
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreatePlantRequestDTO {
    @NotBlank(message = "Scientific name must not be blank")
    private String scientificName;

    @NotBlank(message = "Common name must not be blank")
    private String commonName;

    @NotNull(message = "Category must not null")
    private Long categoryId;

    private String description;

    private String careInstructions;

    @NotNull(message = "Light requirement must not be null")
    private Plants.LightRequirement lightRequirement;

    @NotNull(message = "Water requirement must be not null")
    private Plants.WaterRequirement waterRequirement;

    @NotNull(message = "Care difficulty must be not null")
    private Plants.CareDifficulty careDifficulty;

    private String suitableLocation;

    private String commonDiseases;

    private List<String> imageUrls;
}
