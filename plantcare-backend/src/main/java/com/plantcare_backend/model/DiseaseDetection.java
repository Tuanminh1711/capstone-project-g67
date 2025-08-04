package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "disease_detections")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DiseaseDetection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_plant_id")
    private UserPlants userPlant;

    @Column(name = "detected_disease", nullable = false)
    private String detectedDisease;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "symptoms", columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "recommended_treatment", columnDefinition = "TEXT")
    private String recommendedTreatment;

    @Column(name = "severity", nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @Column(name = "expert_notes", columnDefinition = "TEXT")
    private String expertNotes;

    @CreationTimestamp
    @Column(name = "detected_at")
    private Timestamp detectedAt;

    @Column(name = "treated_at")
    private Timestamp treatedAt;

    @Column(name = "treatment_result")
    private String treatmentResult; // SUCCESS, FAILED, PARTIAL

    @Column(name = "status", nullable = false)
    private String status = "DETECTED"; // DETECTED, CONFIRMED, TREATING, COMPLETED

    @Column(name = "ai_model_version")
    private String aiModelVersion;

    @Column(name = "detection_method")
    private String detectionMethod; // IMAGE, SYMPTOMS, HYBRID
}
