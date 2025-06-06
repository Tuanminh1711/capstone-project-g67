package com.example.plantcare_backend.dto.request;

import com.example.plantcare_backend.dto.validator.GenderSubset;
import com.example.plantcare_backend.dto.validator.PhoneNumber;
import com.example.plantcare_backend.util.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import java.io.Serializable;
import static com.example.plantcare_backend.util.Gender.*;

/**
 * Create by TaHoang
 */

@Getter
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

    @NotBlank(message = "livingEnvironment must be not blank")
    private String livingEnvironment;

    @GenderSubset(anyOf = {MALE, FEMALE, OTHER})
    private Gender gender;

    public UserRequestDTO(String username, String email, String password, String fullName, String phoneNumber, String livingEnvironment, Gender gender) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.livingEnvironment = livingEnvironment;
        this.gender = gender;
    }

}
