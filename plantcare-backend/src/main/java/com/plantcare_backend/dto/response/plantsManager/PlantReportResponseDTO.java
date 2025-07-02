package com.plantcare_backend.dto.response.plantsManager;

import lombok.Data;

import java.sql.Timestamp;

/**
 * created by TaHoang.
 */
@Data
public class PlantReportResponseDTO {
    private Long reportId;
    private Long plantId;
    private String plantName;
    private String scientificName;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reason;
    private String status;
    private String adminNotes;
    private Timestamp createdAt;
}
