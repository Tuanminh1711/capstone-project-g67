package com.plantcare_backend.dto.request.userPlants;

import lombok.Builder;
import lombok.Data;
import java.sql.Timestamp;

@Builder
@Data
public class AddUserPlantRequestDTO {
    private Long plantId;
    private String nickname;
    private Timestamp plantingDate;
    private String locationInHouse;
    private boolean reminderEnabled;
}
