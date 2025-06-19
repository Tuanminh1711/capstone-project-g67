package com.plantcare_backend.service.impl;


import com.plantcare_backend.dto.reponse.UserDetailResponse;
import com.plantcare_backend.dto.request.UserRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Create by TaHoang
 */

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final RoleRepository roleRepository;
    @Autowired
    private final UserProfileRepository userProfileRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private PlantRepository plantRepository;

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
    public void changeStatus(int userId, Users.UserStatus status) {
        Users users = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        users.setStatus(Users.UserStatus.valueOf(status.toString()));
        userRepository.save(users);

        log.info("User status changed to " + status);
    }

    @Override
    public UserDetailResponse getUser(int userId) {
        return null;
    }

    @Override
    public List<UserDetailResponse> getAllUsers(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Users> usersPage = userRepository.findAll(pageable);

        return usersPage.getContent().stream()
                .map(user -> {
                    UserDetailResponse response = new UserDetailResponse();
                    response.setId(user.getId());
                    response.setUsername(user.getUsername());
                    response.setEmail(user.getEmail());
                    response.setStatus(user.getStatus());
                    response.setRole(user.getRole().getRoleName());

                    userProfileRepository.findByUser(user).ifPresent(profile -> {
                        response.setFullName(profile.getFullName());
                        response.setPhone(profile.getPhone());
                        response.setGender(profile.getGender());
                        response.setAvatarUrl(profile.getAvatarUrl());
                        response.setLivingEnvironment(profile.getLivingEnvironment());
                    });
                    return response;
                })
                .collect(Collectors.toList());
    }


    @Override
    public long getTotalPlants() {
        return plantRepository.count();
    }

    @Override
    public long getTotalPlantsByStatus(Plants.PlantStatus status) {
        return plantRepository.countByStatus(status);
    }

    @Override
    public List<Plants> getAllPlants(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return plantRepository.findAll(pageable).getContent();
    }

}
