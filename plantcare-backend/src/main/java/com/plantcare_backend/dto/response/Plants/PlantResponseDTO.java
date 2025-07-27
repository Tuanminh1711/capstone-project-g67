package com.plantcare_backend.dto.response.Plants;

import com.plantcare_backend.model.Plants;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;
import java.util.List;

/**
 * creatd by tahoang
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlantResponseDTO {
    private Long id;
    private String scientificName;
    private String commonName;
    private String categoryName;
    private String description;
    private String careInstructions;
    private Plants.LightRequirement lightRequirement;
    private Plants.WaterRequirement waterRequirement;
    private Plants.CareDifficulty careDifficulty;
    private String suitableLocation;
    private String commonDiseases;
    private Plants.PlantStatus status;
    private List<String> imageUrls;
    private Timestamp createdAt;
    private int reportCount;
}
