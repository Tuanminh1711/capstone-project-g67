package com.example.demo.controller;


import com.example.demo.dto.request.AccountRequestDTO;
import com.example.demo.dto.response.ResponseData;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Create Ta Hoang
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200/")
public class LoginController {

    @PostMapping("/login")
    public ResponseData<?> authenticateUser(@Valid @RequestBody AccountRequestDTO accountRequestDTO) {
        if ("hoang".equals(accountRequestDTO.getUsername()) && "123".equals(accountRequestDTO.getPassword())) {
            System.out.println("==> success: " + accountRequestDTO.getUsername());
            return new ResponseData<>(HttpStatus.ACCEPTED.value(), "Login successful");
        }
        System.out.println("==> fail: " + accountRequestDTO.getUsername());
        return new ResponseData<>(HttpStatus.EXPECTATION_FAILED.value(), "Login failed");
    }
}
