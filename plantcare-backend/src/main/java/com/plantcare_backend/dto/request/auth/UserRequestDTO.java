package com.plantcare_backend.dto.request.auth;

import com.plantcare_backend.dto.validator.GenderSubset;
import com.plantcare_backend.dto.validator.PhoneNumber;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.util.Gender;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;

import static com.plantcare_backend.util.Gender.*;

/**
 * Create by TaHoang
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRequestDTO implements Serializable {

    @NotBlank(message = "username must be not blank")
    private String username;

    @Email(message = "email invalid format! please try again")
    private String email;

    @Size(min = 8, message = "password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least 8 characters, including uppercase, lowercase, number and special character"
    )
    private String password;

    private Boolean generatePassword = false;

    @NotBlank(message = "fullName must not be blank")
    @Pattern(
            regexp = "^[a-zA-Z\\sÀ-ỹ]+$",
            message = "fullName must not contain numbers or special characters"
    )
    private String fullName;

    @PhoneNumber(message = "phone invalid format! please try again")
    private String phoneNumber;

    private String livingEnvironment;

    @GenderSubset(anyOf = {MALE, FEMALE, OTHER})
    private Gender gender;

    @NotNull(message = "roleId must not be null")
    private Integer roleId;

    private Users.UserStatus status;
}
