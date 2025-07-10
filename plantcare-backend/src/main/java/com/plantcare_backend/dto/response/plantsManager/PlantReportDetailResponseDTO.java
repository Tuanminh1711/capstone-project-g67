package com.plantcare_backend.dto.response.plantsManager;

import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

/**
 * DTO for detailed plant report response
 * Created for admin and staff to view report details
 */
@Data
public class PlantReportDetailResponseDTO {
    // Basic report info
    private Long reportId;
    private String reason;
    private String status;
    private String adminNotes;
    private Timestamp createdAt;

    // Plant info
    private Long plantId;
    private String plantName;
    private String scientificName;
    private String plantDescription;
    private String plantStatus;
    private String categoryName;
    private List<String> plantImageUrls;

    // Reporter info
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reporterPhone;

    // Claim info
    private Long claimedById;
    private String claimedByName;
    private String claimedByEmail;
    private Timestamp claimedAt;

    // Handle info
    private Long handledById;
    private String handledByName;
    private String handledByEmail;
    private Timestamp handledAt;

    // Report logs/history
    private List<ReportLogDTO> reportLogs;

    @Data
    public static class ReportLogDTO {
        private Integer logId;
        private String action;
        private String userName;
        private String userEmail;
        private String note;
        private Timestamp createdAt;
    }
}