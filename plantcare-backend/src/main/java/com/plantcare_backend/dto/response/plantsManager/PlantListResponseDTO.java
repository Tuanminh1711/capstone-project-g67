package com.plantcare_backend.dto.response.plantsManager;

import com.plantcare_backend.model.Plants;
import lombok.Data;

import java.sql.Timestamp;

@Data
public class PlantListResponseDTO {
    private Long id;
    private String imageUrl;
    private String scientificName;
    private String commonName;
    private String description;
    private Plants.PlantStatus status;
    private Timestamp createdAt;
}
