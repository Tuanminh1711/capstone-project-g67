package com.plantcare_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordRequestDTO {
    @Email(message = "Invalid email")
    private String email;
    private String resetCode;
    private LocalDateTime expiryTime;
    private boolean used;
}
