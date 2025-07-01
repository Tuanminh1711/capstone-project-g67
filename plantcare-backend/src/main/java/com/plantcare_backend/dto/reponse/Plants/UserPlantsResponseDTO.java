package com.plantcare_backend.dto.reponse.Plants;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.sql.Timestamp;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserPlantsResponseDTO {
    private long userPlantId;
    private long userId;
    private long plantId;
    private String plantName;
    private Timestamp plantDate;
    private String plantLocation;
    private boolean reminderEnabled;
    private Timestamp createdAt;
} 