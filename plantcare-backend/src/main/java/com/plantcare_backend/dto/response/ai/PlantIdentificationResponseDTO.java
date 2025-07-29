package com.plantcare_backend.dto.response.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlantIdentificationResponseDTO {
    private String requestId;
    private List<PlantResult> results;
    private String status;
    private String message;
    
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlantResult {
        private String scientificName;
        private String commonName;
        private String vietnameseName;
        private Double confidence; // Độ tin cậy (0-1)
        private String description;
        private String careInstructions;
        private String imageUrl;
        private Boolean isExactMatch; // Có khớp chính xác với DB không
        private Long plantId; // ID trong DB nếu tìm thấy
    }
} 