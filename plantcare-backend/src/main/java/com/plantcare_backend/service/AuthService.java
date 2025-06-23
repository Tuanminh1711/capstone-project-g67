package com.plantcare_backend.service;

import com.plantcare_backend.dto.reponse.LoginResponse;
import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    LoginResponse loginForUser(LoginRequestDTO loginRequestDTO);

    ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO);

    ResponseData<?> logout(HttpServletRequest httpServletRequest);

    ResponseData<?> changePassword(ChangePasswordRequestDTO requestDTO, String username);
}
