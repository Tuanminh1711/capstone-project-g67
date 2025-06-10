package com.example.plantcare_backend.controller;

import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.reponse.ResponseError;
import com.example.plantcare_backend.dto.reponse.UserDetailResponse;
import com.example.plantcare_backend.dto.request.UserRequestDTO;
import com.example.plantcare_backend.service.UserService;
import com.example.plantcare_backend.util.Translator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Create by TaHoang
 */

@RestController
@RequestMapping("/api/user")
@Slf4j
@Tag(name = "User Controller")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(method = "POST", summary = "Add new user", description = "Send a request via this API to create new user")
    @PostMapping(value = "/adduser")
    public ResponseData<Long> addUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        log.info("Request add user, {} {}", userRequestDTO.getUsername(), userRequestDTO.getPassword());

        try {
            long userId = userService.saveUser(userRequestDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), Translator.toLocale("user.add.success"), userId);
        } catch (Exception e) {
            log.error("add user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add user fail");
        }
    }

    @Operation(method = "POST", summary = "Get list of users", description = "Get paginated list of users")
    @PostMapping("/listaccount")
    public ResponseData<List<UserDetailResponse>> getListAccount(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("Request get list account, pageNo: {}, pageSize: {}", pageNo, pageSize);

        try {
            List<UserDetailResponse> users = userService.getAllUsers(pageNo, pageSize);
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
            userService.deleteUser(userId);
            return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.del.success"));
        } catch (Exception e) {
            log.error("Delete user failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Delete user failed: " + e.getMessage());
        }
    }
}
