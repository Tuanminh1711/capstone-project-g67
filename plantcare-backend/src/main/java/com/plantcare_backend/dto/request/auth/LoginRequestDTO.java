package com.plantcare_backend.dto.request.auth;

import lombok.*;

/**
 * Create by TaHoang
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginRequestDTO {

    private String username;

    private String password;
}
