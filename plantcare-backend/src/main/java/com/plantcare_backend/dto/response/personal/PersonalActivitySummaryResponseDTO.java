package com.plantcare_backend.dto.response.personal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalActivitySummaryResponseDTO {
    private long totalActivities;
    private long totalLoginActivities;
    private long totalPlantActivities;
    private long totalProfileActivities;
    private Map<String, Long> actionTypeCounts; // Breakdown by action type
    private String mostActiveDay; // Day with most activities
    private long mostActiveDayCount;
}