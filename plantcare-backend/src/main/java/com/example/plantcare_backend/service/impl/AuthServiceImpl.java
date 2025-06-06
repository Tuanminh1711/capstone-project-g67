package com.example.plantcare_backend.service.impl;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.AuthService;
import com.example.plantcare_backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Create by TaHoang
 */

@Service
public class AuthServiceImpl implements AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public LoginResponse loginForUser(LoginRequestDTO loginRequestDTO) {
        Users user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username or password wrong!"));
        if (!user.getPassword().equals(loginRequestDTO.getPassword())) {
            throw new RuntimeException("Username or password wrong!");
        }
        String token = jwtUtil.generateToken(user.getUsername());
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(token);
        loginResponse.setUsername(user.getUsername());
        loginResponse.setMessage("Login successful");
        loginResponse.setStatus(HttpStatus.OK.value());
        return loginResponse;
    }
}
