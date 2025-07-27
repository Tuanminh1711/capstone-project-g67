package com.plantcare_backend.dto.response.plantsManager;

import com.plantcare_backend.model.Plants;
import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

@Data
public class PlantDetailResponseDTO {
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
    private String statusDisplay;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String categoryName;
    private List<String> imageUrls;
    private List<PlantImageDetailDTO> images;
}
