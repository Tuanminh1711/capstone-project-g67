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
public class TreatmentGuideResponseDTO {
    private Long id;
    private Integer stepNumber;
    private String title;
    private String description;
    private String duration;
    private String frequency;
    private List<String> materials;
    private String notes;
    private Timestamp createdAt;
}
