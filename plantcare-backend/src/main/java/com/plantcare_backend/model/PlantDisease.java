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
@Table(name = "plant_diseases")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlantDisease {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disease_name", nullable = false)
    private String diseaseName;

    @Column(name = "scientific_name")
    private String scientificName;

    @Column(name = "category", nullable = false)
    private String category; // Nấm, Vi khuẩn, Virus, Sinh lý, Côn trùng

    @Column(name = "symptoms", columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "causes", columnDefinition = "TEXT")
    private String causes;

    @Column(name = "treatment", columnDefinition = "TEXT")
    private String treatment;

    @Column(name = "prevention", columnDefinition = "TEXT")
    private String prevention;

    @Column(name = "severity", nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "affected_plant_types", columnDefinition = "TEXT")
    private String affectedPlantTypes; // JSON array hoặc comma-separated

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "confidence_level")
    private String confidenceLevel;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

}
