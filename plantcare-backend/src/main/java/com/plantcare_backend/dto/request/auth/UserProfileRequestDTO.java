package com.plantcare_backend.dto.request.auth;

import com.plantcare_backend.dto.validator.PhoneNumber;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileRequestDTO {
    private Long id;
    private String username;
    @Email(message = "email invalid format")
    private String email;
    private String fullName;
    @PhoneNumber(message = "phone invalid format")
    private String phoneNumber;
    private String gender;
    private String livingEnvironment;
}
