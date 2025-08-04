package com.plantcare_backend.dto.request.ai_disease;

import lombok.Data;

@Data
public class DiseaseDetectionRequestDTO {
    private Long plantId; // ID của cây cần kiểm tra
    private String symptoms; // Triệu chứng mô tả
    private String plantType; // Loại cây
    private String detectionMethod; // IMAGE, SYMPTOMS, HYBRID
}
