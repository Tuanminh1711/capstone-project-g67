package com.plantcare_backend.dto.request.plantsManager;

import lombok.Data;

@Data
public class PlantReportRequestDTO {
    private Long plantId;
    private String reason;
}
