package com.plantcare_backend.dto.response.Plants;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class UserReportResponseDTO {
    private Long reportId;
    private Long plantId;
    private String plantName;
    private String scientificName;
    private String reason;
    private String status;
    private String adminNotes;
    private Timestamp createdAt;
    private Timestamp handledAt;
    private String handledBy;
}
