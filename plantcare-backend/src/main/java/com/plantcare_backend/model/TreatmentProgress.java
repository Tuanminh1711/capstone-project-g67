package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "treatment_progress")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TreatmentProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detection_id", nullable = false)
    private DiseaseDetection diseaseDetection;

    @Column(name = "current_stage", nullable = false)
    private String currentStage; // DIAGNOSIS, TREATMENT, MONITORING, RECOVERY

    @Column(name = "progress_percentage")
    private Integer progressPercentage; // 0-100

    @Column(name = "next_action", columnDefinition = "TEXT")
    private String nextAction;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "photos", columnDefinition = "TEXT")
    private String photos; // JSON array of photo URLs

    @Column(name = "expected_recovery_date")
    private Timestamp expectedRecoveryDate;

    @CreationTimestamp
    @Column(name = "treatment_start_date")
    private Timestamp treatmentStartDate;

    @UpdateTimestamp
    @Column(name = "last_update_date")
    private Timestamp lastUpdateDate;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;

    @Column(name = "completion_date")
    private Timestamp completionDate;

    @Column(name = "success_rate")
    private Double successRate; // 0.0-1.0
}
