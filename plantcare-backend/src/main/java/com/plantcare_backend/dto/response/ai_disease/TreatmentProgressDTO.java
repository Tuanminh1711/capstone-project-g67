package com.plantcare_backend.dto.response.ai_disease;

import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

@Data
@Builder
public class TreatmentProgressDTO {
    private Long id;
    private Long detectionId;
    private String detectedDisease;
    private String severity;
    private String currentStage;
    private Integer progressPercentage;
    private String nextAction;
    private String notes;
    private List<String> photos;
    private Timestamp treatmentStartDate;
    private Timestamp lastUpdateDate;
    private Boolean isCompleted;
    private Timestamp completionDate;
    private Double successRate;
}
