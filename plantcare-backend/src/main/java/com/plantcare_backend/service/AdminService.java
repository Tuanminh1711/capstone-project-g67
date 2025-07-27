package com.plantcare_backend.service;


import com.plantcare_backend.dto.request.admin.PlantAddedStatisticRequestDTO;
import com.plantcare_backend.dto.request.admin.UserBrowseStatisticRequestDTO;
import com.plantcare_backend.dto.request.admin.UserRegisterStatisticRequestDTO;
import com.plantcare_backend.dto.response.admin.PlantAddedStatisticResponseDTO;
import com.plantcare_backend.dto.response.admin.UserBrowseStatisticResponseDTO;
import com.plantcare_backend.dto.response.admin.UserRegisterStatisticResponseDTO;
import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.dto.request.admin.UserActivityLogRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.Users;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Create by TaHoang
 */

public interface AdminService {

    long saveUser(UserRequestDTO userRequestDTO);

    void updateUser(int userId, UserRequestDTO userRequestDTO);

    void deleteUser(int userId);

    void changeStatus(int userId, Users.UserStatus status);

    UserDetailResponse getUserDetail(int userId);

    List<UserDetailResponse> getAllUsers(int pageNo, int pageSize);

    long getTotalPlants();

    long getTotalPlantsByStatus(Plants.PlantStatus status);


    /**
     * Searches for users based on the provided search criteria.
     * <p>
     * Criteria may include keyword (username, email, full name, phone number),
     * role, and account status.
     * </p>
     *
     * @param searchAccountRequestDTO the DTO containing search filters such as keyword, role, and status
     * @return a list of matching users as {@link UserDetailResponse}
     */
    List<UserDetailResponse> searchUsers(SearchAccountRequestDTO searchAccountRequestDTO);

    Page<UserActivityLogRequestDTO> getUserActivityLogs(int userId, int pageNo, int pageSize);

    void resetPassword(int userId);

    List<UserRegisterStatisticResponseDTO> getUserRegisterStatistics(UserRegisterStatisticRequestDTO requestDTO);

    /**
     * Gets plant added statistics by date range.
     *
     * @param requestDTO DTO containing start and end date for statistics
     * @return List of PlantAddedStatisticResponseDTO containing date and total plants added
     */
    List<PlantAddedStatisticResponseDTO> getPlantAddedStatistics(PlantAddedStatisticRequestDTO requestDTO);

    /**
     * Gets user browse statistics by date range.
     *
     * @param requestDTO DTO containing start and end date for statistics
     * @return List of UserBrowseStatisticResponseDTO containing date and total active users
     */
    List<UserBrowseStatisticResponseDTO> getUserBrowseStatistics(UserBrowseStatisticRequestDTO requestDTO);

}