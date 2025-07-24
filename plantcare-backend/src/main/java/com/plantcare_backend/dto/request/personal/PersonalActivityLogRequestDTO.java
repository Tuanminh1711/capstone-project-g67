package com.plantcare_backend.dto.request.personal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalActivityLogRequestDTO {
    private int pageNo = 0;
    private int pageSize = 10;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String actionType; // Optional filter for specific action
    private String sortBy = "timestamp"; // "timestamp", "action"
    private String sortDirection = "DESC"; // "ASC", "DESC"
} 