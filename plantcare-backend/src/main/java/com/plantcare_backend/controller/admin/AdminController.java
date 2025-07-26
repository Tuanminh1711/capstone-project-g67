package com.plantcare_backend.controller.admin;

import com.plantcare_backend.dto.request.admin.PlantAddedStatisticRequestDTO;
import com.plantcare_backend.dto.request.admin.UserBrowseStatisticRequestDTO;
import com.plantcare_backend.dto.request.admin.UserRegisterStatisticRequestDTO;
import com.plantcare_backend.dto.request.personal.PersonalActivityLogRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.admin.PlantAddedStatisticResponseDTO;
import com.plantcare_backend.dto.response.admin.UserBrowseStatisticResponseDTO;
import com.plantcare_backend.dto.response.admin.UserRegisterStatisticResponseDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivityLogResponseDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivitySummaryResponseDTO;
import com.plantcare_backend.dto.response.auth.UserDetailResponse;
import com.plantcare_backend.dto.request.admin.ChangeUserStatusRequestDTO;
import com.plantcare_backend.dto.request.auth.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.dto.request.admin.UserActivityLogRequestDTO;
import com.plantcare_backend.dto.request.plants.CreatePlantRequestDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.service.PersonalActivityService;
import com.plantcare_backend.service.PlantService;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.util.Translator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Create by TaHoang
 */

@RestController
@RequestMapping("/api/admin")
@Slf4j
@Tag(name = "User Controller")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
public class AdminController {

    private final AdminService adminService;
    private final PersonalActivityService personalActivityService;
    private final ActivityLogService activityLogService;

    /**
     * Creates a new user account in the system.
     *
     * @param userRequestDTO Contains the user details including username and
     *                       password (must be valid).
     * @return ResponseData containing:
     *         - HTTP 201 (Created) status with new user's ID if successful.
     *         - HTTP 400 (Bad Request) status with error message if creation fails.
     * @throws Exception If any unexpected error occurs during user creation.
     */
    @Operation(method = "POST", summary = "Add new user", description = "Send a request via this API to create new user")
    @PostMapping(value = "/adduser")
    public ResponseData<Long> addUser(@Valid @RequestBody UserRequestDTO userRequestDTO,
                                      @RequestAttribute("userId") Integer adminId) {
        log.info("Request add user, {} {}", userRequestDTO.getUsername(), userRequestDTO.getPassword());

        try {
            long userId = adminService.saveUser(userRequestDTO);
            activityLogService.logActivity(adminId, "CREATE_USER",
                    "Admin created user: " + userRequestDTO.getUsername());
            // Log the activity (assuming admin ID is available)
            // Note: We need to get admin ID from request attribute
            return new ResponseData<>(HttpStatus.CREATED.value(), Translator.toLocale("user.add.success"), userId);
        } catch (Exception e) {
            log.error("add user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        }
    }

    @Operation(method = "POST", summary = "Get list of users", description = "Get paginated list of users")
    @PostMapping("/listaccount")
    public ResponseData<List<UserDetailResponse>> getListAccount(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("Request get list account, pageNo: {}, pageSize: {}", pageNo, pageSize);

        try {
            List<UserDetailResponse> users = adminService.getAllUsers(pageNo, pageSize);
            return new ResponseData<>(HttpStatus.OK.value(), "Get list users successfully", users);
        } catch (Exception e) {
            log.error("Get list users failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get list users failed");
        }
    }

    @Operation(method = "POST", summary = "Delete user", description = "Delete user by ID")
    @PostMapping("/deleteuser")
    public ResponseData<?> deleteUser(@RequestParam int userId) {
        log.info("Request delete user with ID: {}", userId);
        try {
            adminService.deleteUser(userId);
            return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.del.success"));
        } catch (Exception e) {
            log.error("Delete user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Delete user failed: " + e.getMessage());
        }
    }

    @Operation(method = "PATCH", summary = "change user status", description = "Change user status (ACTIVE/INACTIVE/BANNED)")
    @PatchMapping("/changestatus/{userId}")
    public ResponseData<?> changeUserStatus(
            @PathVariable int userId,
            @Valid @RequestBody ChangeUserStatusRequestDTO changeUserStatusRequestDTO) {
        log.info("Request change user status, userId: {}, {}", userId, changeUserStatusRequestDTO.getStatus());
        try {
            adminService.changeStatus(userId, changeUserStatusRequestDTO.getStatus());
            return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.status.success"));
        } catch (Exception e) {
            log.error("Change user status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Change user status failed: " + e.getMessage());
        }
    }

    @PostMapping("/search-account")
    public ResponseData<List<UserDetailResponse>> searchAccount(
            @Valid @RequestBody SearchAccountRequestDTO searchAccountRequestDTO) {
        log.info("Admin {} searching users with criteria: {}", searchAccountRequestDTO);

        try {
            List<UserDetailResponse> users = adminService.searchUsers(searchAccountRequestDTO);
            return new ResponseData<>(HttpStatus.OK.value(), "Search completed successfully", users);
        } catch (Exception e) {
            log.error("Search users failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Search failed: " + e.getMessage());
        }
    }

    /**
     * get account detail of user
     *
     * @param userId get id by account
     * @return detail account by id
     */
    @GetMapping("/userdetail/{userId}")
    public ResponseData<UserDetailResponse> getAccountDetail(@PathVariable int userId) {
        try {
            UserDetailResponse userDetail = adminService.getUserDetail(userId);
            return new ResponseData<>(HttpStatus.OK.value(), "User detail get successfully", userDetail);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get user detail");
        }
    }

    @GetMapping("/activity-logs-user/{userId}")
    public ResponseData<Page<UserActivityLogRequestDTO>> getUserActivityLogs(
            @PathVariable int userId,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        try {
            Page<UserActivityLogRequestDTO> logs = adminService.getUserActivityLogs(userId, pageNo, pageSize);
            return new ResponseData<>(HttpStatus.OK.value(), "User activity logs get successfully", logs);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get user activity logs");
        }
    }

    /**
     * update user by admin.
     *
     * @param id             id of user update.
     * @param userRequestDTO entity of user update.
     * @return profile new of user.
     */
    @PutMapping("/updateuser/{userId}")
    public ResponseData<?> updateUser(@PathVariable("userId") int id, @RequestBody UserRequestDTO userRequestDTO) {
        log.info("Request update user with ID: {}", id);
        adminService.updateUser(id, userRequestDTO);
        return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.update.success"));
    }

    @PutMapping("/reset-password/{userId}")
    public ResponseEntity<?> resetPassword(@PathVariable int userId) {
        adminService.resetPassword(userId);
        return ResponseEntity.ok("Password reset and sent to user's email successfully");
    }

    /**
     * get total list of plants.
     *
     * @return total plants.
     */
    @GetMapping("/plants/total")
    public ResponseData<Long> getTotalPlants() {
        try {
            long total = adminService.getTotalPlants();
            return new ResponseData<>(HttpStatus.OK.value(), "Total plants retrieved successfully", total);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get total plants");
        }
    }

    /**
     * get total list following status.
     *
     * @param status ACTIVE, INACTIVE.
     * @return total list plants of status.
     */
    @GetMapping("/plants/total/status/{status}")
    public ResponseData<Long> getTotalPlantsByStatus(@PathVariable Plants.PlantStatus status) {
        try {
            long total = adminService.getTotalPlantsByStatus(status);
            return new ResponseData<>(HttpStatus.OK.value(), "Total plants by status retrieved successfully", total);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get total plants by status");
        }
    }

    @PostMapping("/statistics/registered-users")
    // @PreAuthorize("hasRole('ADMIN')") // Nếu bạn dùng Spring Security annotation
    public List<UserRegisterStatisticResponseDTO> getUserRegisterStatistics(
            @RequestBody UserRegisterStatisticRequestDTO requestDTO) {
        return adminService.getUserRegisterStatistics(requestDTO);
    }

    /**
     * Get plant added statistics by date range.
     *
     * @param requestDTO DTO containing start and end date for statistics
     * @return List of PlantAddedStatisticResponseDTO containing date and total
     * plants added
     */
    @Operation(method = "POST", summary = "Get plant added statistics", description = "Get statistics of plants added by date range")
    @PostMapping("/statistics/added-plants")
    public ResponseData<List<PlantAddedStatisticResponseDTO>> getPlantAddedStatistics(
            @Valid @RequestBody PlantAddedStatisticRequestDTO requestDTO) {
        log.info("Request plant added statistics from {} to {}", requestDTO.getStartDate(), requestDTO.getEndDate());

        try {
            List<PlantAddedStatisticResponseDTO> statistics = adminService.getPlantAddedStatistics(requestDTO);
            return new ResponseData<>(HttpStatus.OK.value(), "Plant added statistics retrieved successfully",
                    statistics);
        } catch (Exception e) {
            log.error("Get plant added statistics failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get plant added statistics: " + e.getMessage());
        }
    }

    /**
     * Get user browse statistics by date range.
     *
     * @param requestDTO DTO containing start and end date for statistics
     * @return List of UserBrowseStatisticResponseDTO containing date and total
     * active users
     */
    @Operation(method = "POST", summary = "Get user browse statistics", description = "Get statistics of active users by date range")
    @PostMapping("/statistics/browse-users")
    public ResponseData<List<UserBrowseStatisticResponseDTO>> getUserBrowseStatistics(
            @Valid @RequestBody UserBrowseStatisticRequestDTO requestDTO) {
        log.info("Request user browse statistics from {} to {}", requestDTO.getStartDate(), requestDTO.getEndDate());

        try {
            List<UserBrowseStatisticResponseDTO> statistics = adminService.getUserBrowseStatistics(requestDTO);
            return new ResponseData<>(HttpStatus.OK.value(), "User browse statistics retrieved successfully",
                    statistics);
        } catch (Exception e) {
            log.error("Get user browse statistics failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get user browse statistics: " + e.getMessage());
        }
    }

    /**
     * Get activity logs for a specific user (Admin/Staff only)
     *
     * @param userId     ID of the user to get activity logs for
     * @param requestDTO DTO containing filters and pagination
     * @return Page of PersonalActivityLogResponseDTO
     */
    @Operation(method = "POST", summary = "Get user activity logs", description = "Get activity logs for a specific user (Admin/Staff only)")
    @PostMapping("/activity-logs/{userId}")
    public ResponseData<Page<PersonalActivityLogResponseDTO>> getUserActivityLogs(
            @PathVariable int userId,
            @Valid @RequestBody PersonalActivityLogRequestDTO requestDTO) {
        log.info("Admin requesting activity logs for user: {}", userId);

        try {
            Page<PersonalActivityLogResponseDTO> activityLogs = personalActivityService.getPersonalActivityLogs(userId,
                    requestDTO);
            return new ResponseData<>(HttpStatus.OK.value(), "User activity logs retrieved successfully", activityLogs);
        } catch (Exception e) {
            log.error("Failed to get activity logs for user: {}", userId, e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get user activity logs: " + e.getMessage());
        }
    }

    /**
     * Get activity summary for a specific user (Admin/Staff only)
     *
     * @param userId ID of the user to get activity summary for
     * @return PersonalActivitySummaryResponseDTO containing summary statistics
     */
    @Operation(method = "GET", summary = "Get user activity summary", description = "Get activity summary for a specific user (Admin/Staff only)")
    @GetMapping("/activity-logs/{userId}/summary")
    public ResponseData<PersonalActivitySummaryResponseDTO> getUserActivitySummary(@PathVariable int userId) {
        log.info("Admin requesting activity summary for user: {}", userId);

        try {
            PersonalActivitySummaryResponseDTO summary = personalActivityService.getPersonalActivitySummary(userId);
            return new ResponseData<>(HttpStatus.OK.value(), "User activity summary retrieved successfully", summary);
        } catch (Exception e) {
            log.error("Failed to get activity summary for user: {}", userId, e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get user activity summary: " + e.getMessage());
        }
    }

}
