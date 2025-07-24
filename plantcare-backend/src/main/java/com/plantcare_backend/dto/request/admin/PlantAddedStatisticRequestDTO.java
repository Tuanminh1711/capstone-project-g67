package com.plantcare_backend.dto.request.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlantAddedStatisticRequestDTO {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}