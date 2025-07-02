package com.plantcare_backend.dto.response.userPlants;

import lombok.Data;

@Data
public class UserPlantImageDetailDTO {
    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private String description;
}