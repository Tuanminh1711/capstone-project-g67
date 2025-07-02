package com.plantcare_backend.dto.request.userPlants;

import lombok.Data;

@Data
public class UserPlantGetAllRequestDTO {
    private Long userPlantId;
    private String nickname;
    private String locationInHouse;
    private String status;
    private boolean reminderEnabled;
    private Integer page = 0;
    private Integer size = 10;
}
