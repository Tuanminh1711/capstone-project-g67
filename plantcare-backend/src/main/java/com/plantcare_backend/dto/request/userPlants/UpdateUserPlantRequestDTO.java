package com.plantcare_backend.dto.request.userPlants;

import lombok.Data;
import java.sql.Timestamp;

@Data
public class UpdateUserPlantRequestDTO {
    private Long userPlantId;
    private String nickname;
    private Timestamp plantingDate;
    private String locationInHouse;
    private boolean reminderEnabled;
} 