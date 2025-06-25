package com.plantcare_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class ForgotPasswordRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}
