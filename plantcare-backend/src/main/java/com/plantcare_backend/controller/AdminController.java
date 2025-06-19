package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.reponse.ResponseError;
import com.plantcare_backend.dto.reponse.UserDetailResponse;
import com.plantcare_backend.dto.request.ChangeUserStatusRequestDTO;
import com.plantcare_backend.dto.request.UserRequestDTO;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.util.Translator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
public class AdminController {

    private final AdminService adminService;

    /**
     *
     * @param userRequestDTO
     * @return
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
        try{
            adminService.changeStatus(userId, changeUserStatusRequestDTO.getStatus());
            return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.status.success"));
        } catch (Exception e) {
            log.error("Change user status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Change user status failed: " + e.getMessage());
        }
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


}
