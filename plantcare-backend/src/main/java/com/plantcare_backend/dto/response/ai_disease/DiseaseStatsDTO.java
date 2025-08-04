package com.plantcare_backend.dto.response.ai_disease;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DiseaseStatsDTO {
    private Long totalDetections;
    private Long confirmedDetections;
    private Long criticalDetections;
    private Double averageConfidenceScore;
    private Map<String, Long> diseaseCounts;
    private Map<String, Long> severityCounts;
    private List<String> recentDiseases;
    private Double treatmentSuccessRate;
}
