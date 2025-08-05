package com.plantcare_backend.dto.response.Plants;

import com.plantcare_backend.model.Plants;
import lombok.Data;
import java.util.List;

@Data
public class UserPlantDetailResponseDTO {
    private Long id;
    private String scientificName;
    private String commonName;
    private String description;
    private String careInstructions;
    private String suitableLocation;
    private String commonDiseases;
    private String status;
    private Plants.WaterRequirement waterRequirement;
    private Plants.LightRequirement lightRequirement;
    private Plants.CareDifficulty careDifficulty;
    private String categoryName;
    private List<String> imageUrls;
}
