package com.plantcare_backend.dto.request.ai_disease;

import lombok.Data;

@Data
public class TreatmentProgressUpdateDTO {
    private Integer progressPercentage;
    private String currentStage;
    private String nextAction;
    private String notes;
    private String photos; // JSON array of photo URLs
    private String expectedRecoveryDate;
}
