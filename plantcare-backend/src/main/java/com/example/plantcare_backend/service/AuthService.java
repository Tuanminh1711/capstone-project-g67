package com.example.plantcare_backend.service;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.ChangePasswordRequestDTO;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.dto.request.RegisterRequestDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    LoginResponse loginForUser(LoginRequestDTO loginRequestDTO);

    ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO);

    ResponseData<?> logout(HttpServletRequest httpServletRequest);

    ResponseData<?> changePassword(ChangePasswordRequestDTO requestDTO, String username);
}
