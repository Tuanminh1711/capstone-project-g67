package com.plantcare_backend.dto.request.admin;

import lombok.*;

import java.time.LocalDateTime;

/**
 * created by tahoang
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityLogRequestDTO {
    private Long id;
    private String action;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String description;
}
