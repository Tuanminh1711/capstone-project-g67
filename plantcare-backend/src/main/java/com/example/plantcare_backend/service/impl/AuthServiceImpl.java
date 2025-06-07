package com.example.plantcare_backend.service.impl;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.dto.request.RegisterRequestDTO;
import com.example.plantcare_backend.model.Role;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.RoleRepository;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.AuthService;
import com.example.plantcare_backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    @Override
    public ResponseData<?> registerForUser(RegisterRequestDTO registerRequestDTO) {
        try {
            if (userRepository.existsByUsername(registerRequestDTO.getUsername())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Username already exists");
            }

            if (!registerRequestDTO.getPassword().equals(registerRequestDTO.getConfirmPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Password and confirm password do not match");
            }

            Users user = new Users();
            user.setUsername(registerRequestDTO.getUsername());
            user.setEmail(registerRequestDTO.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));
            user.setFullName(registerRequestDTO.getFullName());
            user.setPhone(registerRequestDTO.getPhone());
            user.setStatus(Users.UserStatus.ACTIVE);

            Role userRole = roleRepository.findByRoleName(Role.RoleName.USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            user.setRole(userRole);

            Users savedUser = userRepository.save(user);

            savedUser.setPassword(null);
            return new ResponseData<>(HttpStatus.CREATED.value(), "User registered successfully", savedUser);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Error registering user: " + e.getMessage());
        }
    }
}
