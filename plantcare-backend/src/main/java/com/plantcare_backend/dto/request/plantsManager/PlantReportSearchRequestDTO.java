package com.plantcare_backend.dto.request.plantsManager;

import lombok.Data;

/**
 * created by TaHoang.
 */
@Data
public class PlantReportSearchRequestDTO {
    private String status;
    private String plantName;
    private String reporterName;
    private int page = 0;
    private int size = 10;
}
