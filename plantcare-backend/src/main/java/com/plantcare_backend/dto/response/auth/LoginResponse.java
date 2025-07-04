package com.plantcare_backend.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Create by TaHoang
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private int userId;
    private String message;
    private int status;
    private String role;
    private String email;
    private Boolean requiresVerification;
}