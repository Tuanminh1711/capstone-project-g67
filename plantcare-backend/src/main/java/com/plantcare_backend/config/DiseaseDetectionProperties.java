package com.plantcare_backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "plantcare.disease-detection")
public class DiseaseDetectionProperties {

    private SymptomMatching symptomMatching = new SymptomMatching();
    private AiModel aiModel = new AiModel();
    private Notification notification = new Notification();

    @Data
    public static class SymptomMatching {
        private boolean enableSeverityWeighting = true;
        private double minimumConfidenceThreshold = 0.4;
        private int maxAlternativeDiseases = 3;
        private boolean enableSynonymMatching = true;
    }

    @Data
    public static class AiModel {
        private String version = "2.0.0";
        private int maxImageSize = 20 * 1024 * 1024; // 10MB
        private String[] supportedImageFormats = { "jpg", "jpeg", "png", "webp" };
        private int requestTimeout = 30000; // 30 seconds
    }

    @Data
    public static class Notification {
        private boolean enableUrgentAlerts = true;
        private String[] urgentSeverities = { "HIGH", "CRITICAL" };
        private boolean enableEmailNotifications = true;
        private boolean enablePushNotifications = true;
    }
}
