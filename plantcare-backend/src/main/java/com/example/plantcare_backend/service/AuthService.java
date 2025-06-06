package com.example.plantcare_backend.service;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;

/**
 * Create by TaHoang
 */

public interface AuthService {

    LoginResponse loginForUser(LoginRequestDTO loginRequestDTO);

}
