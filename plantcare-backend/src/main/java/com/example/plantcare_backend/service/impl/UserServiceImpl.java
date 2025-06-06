package com.example.plantcare_backend.service.impl;


import com.example.plantcare_backend.dto.reponse.UserDetailResponse;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.dto.validator.UserStatus;
import com.example.plantcare_backend.model.Role;
import com.example.plantcare_backend.model.Users;
import com.example.plantcare_backend.repository.RoleRepository;
import com.example.plantcare_backend.repository.UserRepository;
import com.example.plantcare_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Create by TaHoang
 */

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
