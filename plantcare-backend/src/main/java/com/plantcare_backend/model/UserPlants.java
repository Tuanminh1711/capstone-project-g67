package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

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
    private long UserPlantId;

    @Column(name = "user_id")
    private long userId;

    @Column(name = "plant_id")
    private long plantId;

    @Column(name = "nickname")
    private String plantName;

    @Column(name = "planting_date")
    private Timestamp plantDate;

    @Column(name = "location_in_house")
    private String plantLocation;

    @Column(name = "reminder_enabled")
    private boolean reminder_enabled;

    @Column(name = "created_at")
    private Timestamp created_at;
}
