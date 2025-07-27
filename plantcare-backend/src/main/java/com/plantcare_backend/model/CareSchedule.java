package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "care_schedules")
public class CareSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_plant_id")
    private UserPlants userPlant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_type_id")
    private CareType careType;

    @Column(name = "frequency_days")
    private Integer frequencyDays;

    @Column(name = "last_care_date")
    private Date lastCareDate;

    @Column(name = "next_care_date")
    private Date nextCareDate;

    @Column(name = "created_at")
    private Timestamp createdAt;

    @Column(name = "reminder_time")
    private java.time.LocalTime reminderTime;

    @Column(name = "reminder_enabled")
    private Boolean reminderEnabled;

    @Column(name = "custom_message")
    private String customMessage;

    @Column(name = "start_date")
    private Date startDate;
}
