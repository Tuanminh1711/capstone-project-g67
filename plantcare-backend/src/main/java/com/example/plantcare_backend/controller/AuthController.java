package com.example.plantcare_backend.controller;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    private AuthService authService;

    @Operation(summary = "User Login", description = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> Login(@RequestBody LoginRequestDTO loginRequestDTO) {
        LoginResponse loginResponse = authService.loginForUser(loginRequestDTO);
        return ResponseEntity.ok(loginResponse);
    }
}
