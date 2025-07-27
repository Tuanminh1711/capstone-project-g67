package com.plantcare_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRegisterStatisticResponseDTO {
    private LocalDate date;
    private long totalRegistered;
}
