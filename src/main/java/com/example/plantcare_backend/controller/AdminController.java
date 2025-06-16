package com.example.plantcare_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Operation(method = "POST", summary = "Change user status", description = "Change user status (ACTIVE/INACTIVE/BANNED)")
    @PostMapping("/changestatus/{userId}")
    public ResponseData<?> changeUserStatus(
            @PathVariable int userId,
            @Valid @RequestBody ChangeUserStatusRequestDTO requestDTO) {
        log.info("Request change status for user ID: {} to status: {}", userId, requestDTO.getStatus());

        try {
            adminService.changeStatus(userId, requestDTO.getStatus());
            return new ResponseData<>(HttpStatus.OK.value(), Translator.toLocale("user.change.success"));
        } catch (Exception e) {
            log.error("Change user status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Change user status failed: " + e.getMessage());
        }
    }
}