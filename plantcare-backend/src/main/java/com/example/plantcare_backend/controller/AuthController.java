package com.example.plantcare_backend.controller;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.dto.request.RegisterRequestDTO;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.service.impl.AuthServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Create by TaHoang
 */

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {
    @Autowired
    private AuthServiceImpl authService;

    @Operation(summary = "User Login", description = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> Login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        LoginResponse loginResponse = authService.loginForUser(loginRequestDTO);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<ResponseData<?>> registerForUser(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
        System.out.println("Register request: " + registerRequestDTO);
        ResponseData<?> responseData = authService.registerForUser(registerRequestDTO);
        return ResponseEntity.status(responseData.getStatus()).body(responseData);
    }
}
