package com.plantcare_backend.dto.response.ai_disease;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TreatmentGuideDTO {
    private String diseaseName;
    private String severity;
    private List<TreatmentStepDTO> steps;
    private List<String> requiredProducts;
    private String estimatedDuration;
    private String successRate;
    private List<String> precautions;
    private String followUpSchedule;
    private String expertNotes;
}
