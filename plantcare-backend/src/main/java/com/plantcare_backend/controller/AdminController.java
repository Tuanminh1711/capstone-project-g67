package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.reponse.ResponseError;
import com.plantcare_backend.dto.reponse.UserDetailResponse;
import com.plantcare_backend.dto.request.admin.ChangeUserStatusRequestDTO;
import com.plantcare_backend.dto.request.UserRequestDTO;
import com.plantcare_backend.dto.request.admin.SearchAccountRequestDTO;
import com.plantcare_backend.dto.request.admin.UserActivityLogRequestDTO;
import com.plantcare_backend.dto.request.plants.CreatePlantRequestDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.service.PlantService;
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

import java.time.LocalDateTime;
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
    private final PlantService plantService;

    /**
     * Creates a new user account in the system.
     *
     * @param userRequestDTO Contains the user details including username and password (must be valid).
     * @return ResponseData containing:
     *            - HTTP 201 (Created) status with new user's ID if successful.
     *            - HTTP 400 (Bad Request) status with error message if creation fails.
     *  @throws Exception If any unexpected error occurs during user creation.
     */
    @Operation(method = "POST", summary = "Add new user", description = "Send a request via this API to create new user")
    @PostMapping(value = "/adduser")
    public ResponseData<Long> addUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        log.info("Request add user, {} {}", userRequestDTO.getUsername(), userRequestDTO.getPassword());

        try {
            long userId = adminService.saveUser(userRequestDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), Translator.toLocale("user.add.success"), userId);
        } catch (Exception e) {
            log.error("add user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add user fail");
        }
    }

    /**
     *
     * @param pageNo
     * @param pageSize
     * @return
     */
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

    /**
     *
     * @param userId
     * @return
     */
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

    /**
     *
     * @param userId
     * @param changeUserStatusRequestDTO
     * @return
     */
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

    /**
     *
     * @param userId
     * @param pageNo
     * @param pageSize
     * @return
     */
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
     * @param id id of user update.
     * @param userRequestDTO entity of user update.
     * @return profile new of user.
     */
    @PutMapping("/updateuser/{userId}")
    public ResponseData<?> updateUser(@PathVariable("userId") int id, @RequestBody UserRequestDTO userRequestDTO) {
        log.info("Request update user with ID: {}", id);
        adminService.updateUser(id, userRequestDTO);
        return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.update.success"));
    }

    /**
     *
     * @param userId
     * @return
     */
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

    /**
     *
     *
     * @param pageNo
     * @param pageSize
     * @return
     */
    @GetMapping("/plants")
    public ResponseData<List<Plants>> getAllPlants(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        try {
            List<Plants> plants = adminService.getAllPlants(pageNo, pageSize);
            return new ResponseData<>(HttpStatus.OK.value(), "Plants retrieved successfully", plants);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get plants");
        }
    }

    @Operation(method = "POST", summary = "Create new plant", description = "Admin creates a new plant in the system")
    @PostMapping("/createplants")
    public ResponseData<Long> createPlant(@Valid @RequestBody CreatePlantRequestDTO createPlantRequestDTO) {
        log.info("Admin request to create new plant: {}", createPlantRequestDTO.getScientificName());

        try {
            Long plantId = plantService.createPlant(createPlantRequestDTO);
            return new ResponseData<>(
                    HttpStatus.CREATED.value(),
                    Translator.toLocale("plant.create.success"),
                    plantId
            );
        } catch (ResourceNotFoundException e) {
            log.error("Category not found for plant creation", e);
            return new ResponseError(HttpStatus.NOT_FOUND.value(), e.getMessage());
        } catch (InvalidDataException e) {
            log.error("Invalid data for plant creation", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        } catch (Exception e) {
            log.error("Create plant failed", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Create plant failed");
        }
    }

}
