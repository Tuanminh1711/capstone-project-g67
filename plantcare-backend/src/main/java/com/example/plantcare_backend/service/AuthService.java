package com.example.plantcare_backend.service;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.dto.request.RegisterRequestDTO;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    LoginResponse loginForUser(LoginRequestDTO loginRequestDTO);

    ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO);
}
