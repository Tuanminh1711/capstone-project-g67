package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.admin.UserRegisterStatisticRequestDTO;
import com.plantcare_backend.dto.response.admin.UserRegisterStatisticResponseDTO;
import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.dto.request.admin.UserActivityLogRequestDTO;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.*;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.service.EmailService;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
    private final PasswordEncoder passwordEncoder;
    @Autowired
    private final PlantRepository plantRepository;
    @Autowired
    private final UserActivityLogRepository userActivityLogRepository;
    @Autowired
    private final EmailService emailService;

    /**
     * Creates a new user along with their profile based on the provided data.
     *
     * @param userRequestDTO DTO containing user information (username, email, password, role ID, phone, etc.)
     * @return the ID of the newly created user
     * @throws RuntimeException if the specified role is not found or any error occurs during saving
     */
    @Override
    public long saveUser(UserRequestDTO userRequestDTO) {
        if (userRepository.existsByUsername(userRequestDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userRequestDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (userProfileRepository.existsByPhone(userRequestDTO.getPhoneNumber())) {
            throw new RuntimeException("Phone number already exists");
        }
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

    /**
     * Updates basic information (email, status) and profile (full name, phone, gender)
     * for an existing user.
     *
     * @param userId         ID of the user to update
     * @param userRequestDTO DTO containing updated user and profile data
     * @throws RuntimeException if the user or profile is not found
     */
    @Override
    public void updateUser(int userId, UserRequestDTO userRequestDTO) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(userRequestDTO.getStatus());
        user.setEmail(userRequestDTO.getEmail());

        userRepository.save(user);

        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Profile not found for user ID: " + userId));
        userProfile.setFullName(userRequestDTO.getFullName());
        userProfile.setPhone(userRequestDTO.getPhoneNumber());
        userProfile.setGender(userRequestDTO.getGender());

        userProfileRepository.save(userProfile);
    }

    /**
     * Deletes a user by their ID.
     *
     * @param userId ID of the user to delete
     *               (Currently not implemented)
     */
    @Override
    public void deleteUser(int userId) {

    }

    /**
     * Changes the status (e.g., ACTIVE, INACTIVE) of a user.
     *
     * @param userId ID of the user
     * @param status New status to be applied
     * @throws RuntimeException if the user is not found
     */
    @Override
    public void changeStatus(int userId, Users.UserStatus status) {
        Users users = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        users.setStatus(Users.UserStatus.valueOf(status.toString()));
        userRepository.save(users);

        log.info("User status changed to " + status);
    }

    /**
     * Retrieves detailed information of a user by their ID.
     *
     * @param userId ID of the user
     * @return UserDetailResponse containing user and profile information
     * @throws RuntimeException if the user is not found
     */
    @Override
    public UserDetailResponse getUserDetail(int userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDetailResponse(user);
    }

    /**
     * Retrieves a paginated list of all users with their detailed information.
     *
     * @param pageNo   Page number (starting from 0)
     * @param pageSize Number of records per page
     * @return List of UserDetailResponse
     */
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

    /**
     * Searches users based on keyword (username, email, full name, phone),
     * and optionally filters by role and status.
     *
     * @param searchAccountRequestDTO DTO containing search keyword, role, status, and pagination
     * @return List of UserDetailResponse matching the search criteria
     */
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

    /**
     * Retrieves a paginated list of activity logs for a specific user.
     *
     * @param userId   ID of the user
     * @param pageNo   Page number
     * @param pageSize Number of logs per page
     * @return Page of UserActivityLogRequestDTO
     */
    @Override
    public Page<UserActivityLogRequestDTO> getUserActivityLogs(int userId, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<UserActivityLog> logs = userActivityLogRepository.findByUser_Id(userId, pageable);
        return logs.map(log -> UserActivityLogRequestDTO.builder()
                .id(log.getId())
                .action(log.getAction())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .description(log.getDescription())
                .build());
    }

    /**
     * Converts a Users entity to a UserDetailResponse DTO, including profile data if available.
     *
     * @param user Users entity
     * @return UserDetailResponse
     */
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

    /**
     * Gets the total number of plant records.
     *
     * @return total number of plants
     */
    @Override
    public long getTotalPlants() {
        return plantRepository.count();
    }

    /**
     * Gets the total number of plants by a specific status.
     *
     * @param status The status to filter (e.g., AVAILABLE, UNAVAILABLE)
     * @return count of plants matching the status
     */
    @Override
    public long getTotalPlantsByStatus(Plants.PlantStatus status) {
        return plantRepository.countByStatus(status);
    }

    /**
     * Resets the password of a user to a new randomly generated one and sends it via email.
     *
     * @param userId ID of the user whose password is to be reset
     * @throws RuntimeException if the user is not found
     */
    @Override
    public void resetPassword(int userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String newPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        emailService.sendEmail(user.getEmail(), "Your password has been reset",
                "Your new password is: " + newPassword);
    }

    /**
     * @param requestDTO
     * @return
     */
    @Override
    public List<UserRegisterStatisticResponseDTO> getUserRegisterStatistics(UserRegisterStatisticRequestDTO requestDTO) {
        List<Object[]> results = userRepository.countUsersRegisteredByDate(
                requestDTO.getStartDate(), requestDTO.getEndDate()
        );
        List<UserRegisterStatisticResponseDTO> responseList = new ArrayList<>();
        for (Object[] row : results) {
            LocalDate date = (row[0] instanceof java.sql.Date)
                    ? ((java.sql.Date) row[0]).toLocalDate()
                    : (LocalDate) row[0];
            long total = ((Number) row[1]).longValue();
            responseList.add(new UserRegisterStatisticResponseDTO(date, total));
        }
        return responseList;
    }

    /**
     * Generates a random 8-character alphanumeric password.
     *
     * @return a new random password
     */
    private String generateRandomPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

}
