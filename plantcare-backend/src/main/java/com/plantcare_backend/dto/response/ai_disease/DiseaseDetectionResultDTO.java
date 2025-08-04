package com.plantcare_backend.dto.response.ai_disease;

import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;
import java.util.List;
@Data
@Builder
public class DiseaseDetectionResultDTO {
    private Long detectionId;
    private String detectedDisease;
    private Double confidenceScore;
    private String severity;
    private String symptoms;
    private String recommendedTreatment;
    private String prevention;
    private String causes;
    private String imageUrl;
    private Boolean isConfirmed;
    private String status;
    private Timestamp detectedAt;
    private String detectionMethod;
    private String aiModelVersion;
    private List<String> alternativeDiseases; // Các bệnh có thể khác
    private TreatmentGuideDTO treatmentGuide;
}
