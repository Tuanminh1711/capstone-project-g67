package com.plantcare_backend.dto.response.personal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalActivityLogResponseDTO {
    private Long id;
    private String action;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String description;
    private String location; // Location info if available
}