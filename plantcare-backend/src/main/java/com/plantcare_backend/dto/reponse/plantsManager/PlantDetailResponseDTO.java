package com.plantcare_backend.dto.reponse.plantsManager;

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
    private String statusDisplay;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String categoryName;
    private List<String> imageUrls;
}
