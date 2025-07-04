package com.plantcare_backend.dto.response.userPlants;

import com.plantcare_backend.dto.response.plantsManager.PlantImageDetailDTO;
import lombok.Data;

import java.util.List;
import java.sql.Timestamp;

@Data
public class UserPlantDetailResponseDTO {
    private Long userPlantId;
    private Long plantId;
    private String nickname;
    private Timestamp plantingDate;
    private String locationInHouse;
    private boolean reminderEnabled;
    private List<String> imageUrls;
    private List<UserPlantImageDetailDTO> images;
}
