package com.plantcare_backend.dto.response.ai_disease;

import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;

@Data
@Builder
public class DiseaseDetectionHistoryDTO {
    private Long id;
    private String detectedDisease;
    private Double confidenceScore;
    private String severity;
    private String symptoms;
    private String recommendedTreatment;
    private String status;
    private Boolean isConfirmed;
    private String expertNotes;
    private Timestamp detectedAt;
    private Timestamp treatedAt;
    private String treatmentResult;
    private String detectionMethod;
    private String aiModelVersion;
}
