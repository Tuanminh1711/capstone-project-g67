package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "care_types")
public class CareType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "care_type_id")
    private Long careTypeId;

    @Column(name = "care_type_name", unique = true)
    private String careTypeName;
}
