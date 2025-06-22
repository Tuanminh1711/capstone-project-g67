package com.plantcare_backend.dto.request.auth;

import lombok.Getter;
import lombok.Setter;

/**
 * Create by TaHoang
 */

@Getter
@Setter
public class LoginRequestDTO {

    private String username;

    private String password;
}
