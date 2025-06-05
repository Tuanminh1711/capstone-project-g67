package com.example.PlantCare_Website_Backend.service.impl;

import com.example.PlantCare_Website_Backend.dto.reponse.UserDetailResponse;
import com.example.PlantCare_Website_Backend.dto.request.UserRequestDTO;
import com.example.PlantCare_Website_Backend.dto.validator.UserStatus;
import com.example.PlantCare_Website_Backend.model.Role;
import com.example.PlantCare_Website_Backend.model.Users;
import com.example.PlantCare_Website_Backend.repository.RoleRepository;
import com.example.PlantCare_Website_Backend.repository.UserRepository;
import com.example.PlantCare_Website_Backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public long saveUser(UserRequestDTO userRequestDTO) {
        try {
            Users user = Users.builder()
                    .username(userRequestDTO.getUsername())
                    .email(userRequestDTO.getEmail())
                    .password(userRequestDTO.getPassword())
                    .fullName(userRequestDTO.getFullName())
                    .phone(userRequestDTO.getPhoneNumber())
                    .gender(userRequestDTO.getGender())
                    .role(Role.builder().id(3).build())
                    .status(Users.UserStatus.ACTIVE)
                    .livingEnvironment(userRequestDTO.getLivingEnvironment())
                    .build();
            userRepository.save(user);

            log.info("user has save!");
            return user.getId();
        } catch (Exception e) {
            log.error("failed to save user", e);
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
