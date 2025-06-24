package com.plantcare_backend.dto.request;

import com.plantcare_backend.dto.validator.GenderSubset;
import com.plantcare_backend.dto.validator.PhoneNumber;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.util.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.io.Serializable;
import static com.plantcare_backend.util.Gender.*;

/**
 * Create by TaHoang
 */

@Getter
@AllArgsConstructor
public class UserRequestDTO implements Serializable {

    @NotBlank(message = "username must be not blank")
    private String username;

    @Email(message = "email invalid format! please try again")
    private String email;

    @NotBlank(message = "password must be not blank")
    @Size(min = 6, message = "password must be at least 6 characters")
    private String password;

    @NotNull(message = "fullName must be not null")
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
