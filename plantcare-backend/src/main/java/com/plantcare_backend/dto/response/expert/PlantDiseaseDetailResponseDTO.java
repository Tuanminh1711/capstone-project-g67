package com.plantcare_backend.dto.response.expert;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantDiseaseDetailResponseDTO {
    private Long id;
    private String diseaseName;
    private String scientificName;
    private String category;
    private String symptoms;
    private String causes;
    private String treatment;
    private String prevention;
    private String severity;
    private String affectedPlantTypes;
    private String imageUrl;
    private String confidenceLevel;
    private Boolean isActive;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private List<TreatmentGuideResponseDTO> treatmentGuides;
}
