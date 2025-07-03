package com.plantcare_backend.dto.response.plantsManager;

import lombok.Data;

@Data
public class PlantImageDetailDTO {
    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private String description;
}