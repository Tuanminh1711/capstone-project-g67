package com.plantcare_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
