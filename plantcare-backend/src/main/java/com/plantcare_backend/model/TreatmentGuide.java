package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "treatment_guides")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TreatmentGuide {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private PlantDisease disease;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration")
    private String duration;

    @Column(name = "frequency")
    private String frequency;

    @Column(name = "materials", columnDefinition = "JSON")
    private String materials; // JSON string

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at")
    private Timestamp createdAt;
}
