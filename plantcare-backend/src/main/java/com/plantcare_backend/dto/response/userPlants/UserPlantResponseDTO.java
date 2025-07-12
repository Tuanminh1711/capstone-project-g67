package com.plantcare_backend.dto.response.userPlants;

import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

@Data
public class UserPlantResponseDTO {
    private Long id;
    private String scientificName;
    private String commonName;
    private String categoryName;
    private String description;
    private String careInstructions;
    private String lightRequirement;
    private String waterRequirement;
    private String careDifficulty;
    private String suitableLocation;
    private String commonDiseases;
    private String status;
    private List<String> imageUrls;
    private Timestamp createdAt;
    private Long createdBy;
    private boolean isUserCreated;
}
