package com.example.plantcare_backend.service.impl;


import com.example.plantcare_backend.dto.reponse.UserDetailResponse;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.dto.validator.UserStatus;
import com.example.plantcare_backend.model.Role;
import com.example.plantcare_backend.model.UserProfile;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.RoleRepository;
import com.example.plantcare_backend.repository.UserProfileRepository;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Create by TaHoang
 */

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final RoleRepository roleRepository;
    @Autowired
    private final UserProfileRepository userProfileRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public long saveUser(UserRequestDTO userRequestDTO) {
        try {
            Users user = Users.builder()
                    .username(userRequestDTO.getUsername())
                    .email(userRequestDTO.getEmail())
                    .password(passwordEncoder.encode(userRequestDTO.getPassword()))
                    .status(Users.UserStatus.ACTIVE)
                    .role(roleRepository.findById(userRequestDTO.getRoleId())
                            .orElseThrow(() -> new RuntimeException("Role not found")))
                    .build();

            Users savedUser = userRepository.save(user);

            UserProfile userProfile = UserProfile.builder()
                    .user(savedUser)
                    .phone(userRequestDTO.getPhoneNumber())
                    .gender(userRequestDTO.getGender())
                    .fullName(userRequestDTO.getFullName())
                    .build();

            userProfileRepository.save(userProfile);

            log.info("User created by admin with role and profile limited fields");

            return savedUser.getId();

        } catch (Exception e) {
            log.error("Failed to create user by admin", e);
            throw e;
        }
    }

    @Override
    public void updateUser(int userId, UserRequestDTO userRequestDTO) {

    }

    @Override
    public void deleteUser(int userId) {

    }

    @Override
    public void changeStatus(int userId, UserStatus status) {

    }

    @Override
    public UserDetailResponse getUser(int userId) {
        return null;
    }

    @Override
    public List<UserDetailResponse> getAllUsers(int pageNo, int pageSize) {
        return List.of();
    }
}
