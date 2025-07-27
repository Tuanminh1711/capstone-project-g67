package com.plantcare_backend.dto.response.userPlants;

import lombok.Data;

@Data
public class UserPlantListResponseDTO {
    private long userPlantId;
    private long plantId;
    private String imageUrl;
    private String nickname;
    private String plantLocation;
}
