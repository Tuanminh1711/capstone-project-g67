package com.example.plantcare_backend.controller;

import com.example.plantcare_backend.dto.reponse.ResponseData;
import com.example.plantcare_backend.dto.request.UserProfileRequestDTO;
import com.example.plantcare_backend.exception.ResourceNotFoundException;
import com.example.plantcare_backend.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@Slf4j
@Tag(name = "User Profile Controller")
public class UserProfileController {
    @Autowired
    private UserProfileService userProfileService;

    @Operation(method = "GET", summary = "Get current user profile", description = "Get profile information of the currently logged in user")
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseData<>(HttpStatus.UNAUTHORIZED.value(),
                                "Please login to access this resource", null));
            }

            String username = authentication.getName();
            UserProfileRequestDTO profile = userProfileService.getUserProfileByUsername(username);
            return ResponseEntity
                    .ok(new ResponseData<>(HttpStatus.OK.value(), "Get current user profile successfully", profile));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "An error occurred while getting user profile", null));
        }
    }

//    @GetMapping("/profile")
//    public ResponseEntity<?> getCurrentUserProfile() {
//        try {
//            // Bỏ qua kiểm tra authentication tạm thời
//            // Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//            // if (authentication == null || !authentication.isAuthenticated()
//            //         || "anonymousUser".equals(authentication.getName())) {
//            //     return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//            //             .body(new ResponseData<>(HttpStatus.UNAUTHORIZED.value(),
//            //                     "Please login to access this resource", null));
//            // }
//
//            // Hardcode username tạm thời để test
//            String username = "testuser"; // Thay bằng username có trong DB của bạn
//            UserProfileRequestDTO profile = userProfileService.getUserProfileByUsername(username);
//            return ResponseEntity
//                    .ok(new ResponseData<>(HttpStatus.OK.value(), "Get current user profile successfully", profile));
//        } catch (ResourceNotFoundException e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                    .body(new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
//                            "An error occurred while getting user profile", null));
//        }
//    }

    @Operation(method = "PUT", summary = "Update current user profile", description = "Update profile information of the currently logged in user")
    @PutMapping("/profile/update")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestBody UserProfileRequestDTO profileDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseData<>(HttpStatus.UNAUTHORIZED.value(),
                                "Please login to access this resource", null));
            }

            String username = authentication.getName();
            UserProfileRequestDTO updatedProfile = userProfileService.updateUserProfileByUsername(username, profileDTO);
            return ResponseEntity
                    .ok(new ResponseData<>(HttpStatus.OK.value(), "Update user profile successfully", updatedProfile));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "An error occurred while updating user profile", null));
        }
    }
}
