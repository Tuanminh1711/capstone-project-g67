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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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
        try {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            UserProfile profile = userProfileRepository.findByUser(user);
            if (profile != null) {
                userProfileRepository.delete(profile);
            }
            userRepository.delete(user);

            log.info("User and profile deleted successfully with ID: {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete user with ID: {}", userId, e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
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
        // Sử dụng Pageable để phân trang
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Users> usersPage = userRepository.findAll(pageable);

        return usersPage.getContent().stream()
                .map(user -> {
                    UserDetailResponse response = new UserDetailResponse();
                    // Map các trường từ Users
                    response.setId(user.getId());
                    response.setUsername(user.getUsername());
                    response.setEmail(user.getEmail());
                    response.setStatus(user.getStatus());
                    response.setRole(user.getRole().getRoleName());

                    // Lấy thông tin từ UserProfile
                    UserProfile profile = userProfileRepository.findByUser(user);
                    if (profile != null) {
                        response.setFullName(profile.getFullName());
                        response.setPhone(profile.getPhone());
                        response.setGender(profile.getGender());
                        response.setAvatarUrl(profile.getAvatarUrl());
                        response.setLivingEnvironment(profile.getLivingEnvironment());
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }
}
