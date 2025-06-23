package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.reponse.UserDetailResponse;
import com.plantcare_backend.dto.request.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Role;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
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
                    .livingEnvironment(null)
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
    public UserDetailResponse getUserDetail(int userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDetailResponse(user);
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
    public List<UserDetailResponse> searchUsers(SearchAccountRequestDTO searchAccountRequestDTO) {
        Pageable pageable = PageRequest.of(searchAccountRequestDTO.getPageNo(), searchAccountRequestDTO.getPageSize());

        // Tạo specification cho search
        Specification<Users> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Keyword search
            if (searchAccountRequestDTO.getKeyword() != null
                    && !searchAccountRequestDTO.getKeyword().trim().isEmpty()) {
                String keyword = "%" + searchAccountRequestDTO.getKeyword().toLowerCase() + "%";

                // Join với UserProfile để search theo fullName và phone
                Join<Users, UserProfile> profileJoin = root.join("userProfile", JoinType.LEFT);

                Predicate usernamePred = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("username")), keyword);
                Predicate emailPred = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("email")), keyword);
                Predicate fullNamePred = criteriaBuilder.like(
                        criteriaBuilder.lower(profileJoin.get("fullName")), keyword);
                Predicate phonePred = criteriaBuilder.like(
                        profileJoin.get("phone"), "%" + searchAccountRequestDTO.getKeyword() + "%");

                predicates.add(criteriaBuilder.or(usernamePred, emailPred, fullNamePred, phonePred));
            }

            // Role filter
            if (searchAccountRequestDTO.getRole() != null) {
                predicates.add(
                        criteriaBuilder.equal(root.get("role").get("roleName"), searchAccountRequestDTO.getRole()));
            }

            // Status filter
            if (searchAccountRequestDTO.getUserStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), searchAccountRequestDTO.getUserStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<Users> usersPage = userRepository.findAll(spec, pageable);

        return usersPage.getContent().stream()
                .map(this::convertToUserDetailResponse)
                .collect(Collectors.toList());
    }

    private UserDetailResponse convertToUserDetailResponse(Users user) {
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
