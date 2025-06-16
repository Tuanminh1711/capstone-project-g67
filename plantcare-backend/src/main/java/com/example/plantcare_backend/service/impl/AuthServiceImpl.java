package com.example.plantcare_backend.service.impl;

import com.example.plantcare_backend.dto.reponse.LoginResponse;
import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.LoginRequestDTO;
import com.example.plantcare_backend.dto.request.RegisterRequestDTO;
import com.example.plantcare_backend.dto.request.ChangePasswordRequestDTO;
import com.example.plantcare_backend.model.Role;
import com.example.plantcare_backend.model.UserProfile;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.RoleRepository;
import com.example.plantcare_backend.repository.UserProfileRepository;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.AuthService;
import com.example.plantcare_backend.util.Gender;
import com.example.plantcare_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Random;

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
    private UserProfileRepository userProfileRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse loginForUser(LoginRequestDTO loginRequestDTO) {
        Users user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username wrong!"));
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("password wrong!");
        }
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName().toString());

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(token);
        loginResponse.setUsername(user.getUsername());
        loginResponse.setMessage("Login successful");
        loginResponse.setStatus(HttpStatus.OK.value());
        loginResponse.setRole(user.getRole().getRoleName().toString());
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
            user.setStatus(Users.UserStatus.ACTIVE);

            Role userRole = roleRepository.findByRoleName(Role.RoleName.USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            user.setRole(userRole);

            Users savedUser = userRepository.save(user);

            try {
                UserProfile userProfile = new UserProfile();
                userProfile.setUser(savedUser);
                userProfile.setFullName(registerRequestDTO.getFullName());
                userProfile.setPhone(registerRequestDTO.getPhone());
                userProfile.setGender(null);
                userProfile.setLivingEnvironment(null);
                userProfile.setAvatarUrl(null);

                userProfileRepository.save(userProfile);
            } catch (Exception e) {
                userRepository.delete(savedUser);
                throw new RuntimeException("Failed to create user profile: " + e.getMessage());
            }

            savedUser.setPassword(null);

            return new ResponseData<>(HttpStatus.CREATED.value(), "User registered successfully", savedUser);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error registering user: " + e.getMessage());
        }
    }

    @Override
    public ResponseData<?> logout(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Invalid authorization header");
            }
            String token = authHeader.substring(7);
            jwtUtil.addToBlacklist(token);
            SecurityContextHolder.clearContext();
            return new ResponseData<>(HttpStatus.OK.value(), "Logout successful");
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error during logout: " + e.getMessage());
        }
    }

    @Override
    public ResponseData<?> changePassword(ChangePasswordRequestDTO requestDTO, String username) {
        try {
            Users user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), user.getPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Current password is incorrect");
            }

            if (!requestDTO.getNewPassword().equals(requestDTO.getConfirmPassword())) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(),
                        "New password and confirm password do not match");
            }

            user.setPassword(passwordEncoder.encode(requestDTO.getNewPassword()));
            userRepository.save(user);

            return new ResponseData<>(HttpStatus.OK.value(), "Password changed successfully");
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error changing password: " + e.getMessage());
        }
    }
}
