package com.plantcare_backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "user_plants")
public class UserPlants {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_plant_id")
    private Long userPlantId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "plant_id")
    private Long plantId;

    @Column(name = "nickname")
    private String plantName;

    @Column(name = "planting_date")
    private Timestamp plantDate;

    @Column(name = "location_in_house")
    private String plantLocation;

    @OneToMany(mappedBy = "userPlants", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<UserPlantImage> images;

    @Column(name = "created_at")
    private Timestamp created_at;
}
