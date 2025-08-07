package com.plantcare_backend.dto.response.ai_disease;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantIdResponse {
    private List<PlantIdResult> results;
    private String status;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlantIdResult {
        private String name;
        private Double probability;
        private List<PlantIdDisease> diseases;
        private List<PlantIdHealth> health;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlantIdDisease {
        private String name;
        private Double probability;
        private String description;
        private String treatment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlantIdHealth {
        private String name;
        private Double probability;
        private String description;
    }
}