package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.auth.LoginResponse;
import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.request.auth.ChangePasswordRequestDTO;
import com.plantcare_backend.dto.request.auth.LoginRequestDTO;
import com.plantcare_backend.dto.request.auth.RegisterRequestDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    LoginResponse loginForUser(LoginRequestDTO loginRequestDTO, HttpServletRequest request);

    ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO);

    ResponseData<?> logout(HttpServletRequest httpServletRequest);

    ResponseData<?> changePassword(ChangePasswordRequestDTO requestDTO, Integer userId);
}
