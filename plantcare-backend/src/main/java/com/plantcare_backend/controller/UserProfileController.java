package com.plantcare_backend.controller;

import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.request.auth.UserProfileRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * created by TaHoang
 */

@RestController
@RequestMapping("/api/user")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "User Profile Controller")
@CrossOrigin(origins = "http://localhost:4200/")
public class UserProfileController {
    @Autowired
    private final UserProfileService userProfileService;


    @GetMapping("/profile")
    public ResponseEntity<UserProfileRequestDTO> getCurrentUserProfile(@RequestAttribute("userId") Integer userId) {
        UserProfileRequestDTO profile = userProfileService.getUserProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/updateprofile")
    public ResponseEntity<ResponseData<UserProfileRequestDTO>> updateProfile(
            @RequestAttribute("userId") Integer userId,
            @RequestBody @Valid UserProfileRequestDTO profileDTO) {

        try {

            UserProfileRequestDTO updatedProfile = userProfileService.updateUserProfile(userId, profileDTO);

            log.info("Profile updated successfully for user ID: {}", userId);
            return ResponseEntity.ok(
                    new ResponseData<>(
                            HttpStatus.OK.value(),
                            "Profile updated successfully",
                            updatedProfile
                    )
            );
        } catch (NumberFormatException e) {
            log.error("Invalid user ID format in authentication token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ResponseData<>(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Invalid authentication",
                            null
                    )
            );
        } catch (ResourceNotFoundException e) {
            log.error("Profile update failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseData<>(
                            HttpStatus.NOT_FOUND.value(),
                            e.getMessage(),
                            null
                    )
            );
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    new ResponseData<>(
                            HttpStatus.BAD_REQUEST.value(),
                            e.getMessage(),
                            null
                    )
            );
        } catch (Exception e) {
            log.error("Internal server error during profile update: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    new ResponseData<>(
                            HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "Internal server error",
                            null
                    )
            );
        }
    }
}
