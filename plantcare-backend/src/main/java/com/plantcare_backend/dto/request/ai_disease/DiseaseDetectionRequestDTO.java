package com.plantcare_backend.dto.request.ai_disease;

import lombok.Data;

@Data
public class DiseaseDetectionRequestDTO {
    private String description;
    private String detectionMethod;
}
