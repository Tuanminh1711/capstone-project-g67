package com.example.demo.dto.request;

import com.example.demo.util.PhoneNumber;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;


/**
 * DTO data transfer object đối tượng chuyền dữ liệu từ client đến server.
 * implements Serializable
 *               +, Chuyển đổi thành byte stream để truyền qua mạng.
 *               +, Lưu trữ vào file hoặc database.
 */

public class UserRequestDTO implements Serializable {
    @NotBlank  (message = "firstName must be not blank")
    private String firstName;
    @NotNull (message = "lastName must be not null")
    private String lastName;
    @PhoneNumber
    private String phone;
    @Email(message = "Email is invalid format")
    private String email;

    @NotNull(message = "dateOfBirth must be not null")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @JsonFormat(pattern = "MM/dd/yyyy")
    private Date dateOfBirth;

    public UserRequestDTO(String firstName, String lastName, String phone, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }
}
