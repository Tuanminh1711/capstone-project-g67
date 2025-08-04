package com.plantcare_backend.dto.response.ai_disease;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TreatmentStepDTO {
    private Integer stepNumber;
    private String title;
    private String description;
    private String duration;
    private String frequency;
    private List<String> materials;
    private String notes;
    private Boolean isCompleted;
}
