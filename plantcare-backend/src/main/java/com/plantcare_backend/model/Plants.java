package com.plantcare_backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.List;

/**
 * created by tahoang
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "plants")
public class Plants {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plant_id")
    private Long id;

    @Column(name = "scientific_name", nullable = false, length = 100)
    private String scientificName;

    @Column(name = "common_name", nullable = false, length = 100)
    private String commonName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonBackReference
    private PlantCategory category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;

    @Enumerated(EnumType.STRING)
    @Column(name = "light_requirement")
    private LightRequirement lightRequirement;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_requirement")
    private WaterRequirement waterRequirement;

    @Enumerated(EnumType.STRING)
    @Column(name = "care_difficulty")
    private CareDifficulty careDifficulty;

    @Column(name = "suitable_location", columnDefinition = "TEXT")
    private String suitableLocation;

    @Column(name = "common_diseases", columnDefinition = "TEXT")
    private String commonDiseases;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PlantStatus status = PlantStatus.ACTIVE;

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<PlantImage> images;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    @Column(name = "created_by", nullable = true)
    private Long createdBy;

    //Cây có sẵn (import hoặc admin tạo)
    public boolean isOfficialPlant() {
        return createdBy == null;
    }

    // Cây do user tạo
    public boolean isUserCreatedPlant() {
        return createdBy != null;
    }

    public boolean isAdminPlant() {
        return createdBy != null && createdBy == 1L;
    }

    public enum LightRequirement {
        LOW, MEDIUM, HIGH
    }

    public enum WaterRequirement {
        LOW, MEDIUM, HIGH
    }

    public enum CareDifficulty {
        EASY, MODERATE, DIFFICULT
    }

    public enum PlantStatus {
        ACTIVE, INACTIVE
    }
}
