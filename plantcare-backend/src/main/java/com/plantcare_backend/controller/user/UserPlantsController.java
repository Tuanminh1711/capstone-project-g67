package com.plantcare_backend.controller.user;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantListResponseDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.base.ResponseSuccess;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.exception.RateLimitExceededException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.exception.ValidationException;
import com.plantcare_backend.service.UserPlantsService;
import com.plantcare_backend.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-plants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "UserPlants Controller", description = "APIs for user plants management")
@CrossOrigin(origins = "http://localhost:4200/")
public class UserPlantsController {
    private final UserPlantsService userPlantsService;
    private final ActivityLogService activityLogService;

    @Operation(method = "GET", summary = "Search user plants", description = "Search user plants by various criteria with pagination")
    @GetMapping("/search")
    public ResponseData<UserPlantsSearchResponseDTO> searchUserPlants(
            @Valid @ModelAttribute UserPlantsSearchRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        request.setUserId(userId);
        log.info("Request search user plants with criteria: {}", request);
        try {
            UserPlantsSearchResponseDTO result = userPlantsService.searchUserPlants(request);
            return new ResponseData<>(HttpStatus.OK.value(), "Search user plants successfully", result);
        } catch (Exception e) {
            log.error("Search user plants failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Search user plants failed: " + e.getMessage());
        }
    }

    @Operation(method = "GET", summary = "Get all user plants", description = "Get list of all user plants")
    @GetMapping("/get-all-user-plants")
    public ResponseData<Page<UserPlantListResponseDTO>> getAllUserPlants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        log.info("Request get all user plants with page: {}, size: {}", page, size);
        try {
            Page<UserPlantListResponseDTO> userPlants = userPlantsService.getAllUserPlants(page, size, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get user plants successfully", userPlants);
        } catch (Exception e) {
            log.error("Get user plants failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get user plants failed: " + e.getMessage());
        }
    }

    @Operation(method = "GET", summary = "Get user plant detail", description = "Get user plant detail by user plant id")
    @GetMapping("/user-plant-detail/{id}")
    public ResponseData<UserPlantDetailResponseDTO> getUserPlantDetail(@PathVariable Long id) {
        UserPlantDetailResponseDTO dto = userPlantsService.getUserPlantDetail(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Get plant detail successfully", dto);
    }

    @Operation(method = "DELETE", summary = "Delete plant from collection", description = "Delete a plant from user's personal collection")
    @DeleteMapping("/delete/{userPlantId}")
    public ResponseData<ResponseSuccess> deleteUserPlant(
            @PathVariable Long userPlantId,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }
            userPlantsService.deleteUserPlant(userPlantId, userId);

            // Log the activity
            activityLogService.logActivity(userId.intValue(), "DELETE_USER_PLANT",
                    "Deleted user plant with ID: " + userPlantId, request);

            return new ResponseData<>(HttpStatus.OK.value(), "User plant deleted successfully");
        } catch (ResourceNotFoundException e) {
            log.error("User plant not found: {}", e.getMessage());
            return new ResponseError(HttpStatus.NOT_FOUND.value(), "User plant not found");
        } catch (Exception e) {
            log.error("Delete user plant failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Delete user plant failed");
        }
    }

    @PostMapping("/add")
    public ResponseData<?> addUserPlant(
            @ModelAttribute AddUserPlantRequestDTO requestDTO,
            HttpServletRequest request,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        
        // Debug logging
        log.info("=== DEBUG ADD USER PLANT ===");
        log.info("User ID: {}", userId);
        log.info("Request DTO: {}", requestDTO);
        log.info("Plant ID: {}", requestDTO.getPlantId());
        log.info("Nickname: {}", requestDTO.getNickname());
        log.info("Planting Date: {}", requestDTO.getPlantingDate());
        log.info("Location: {}", requestDTO.getLocationInHouse());
        log.info("Images count: {}", images != null ? images.size() : 0);
        log.info("==========================");
        
        try {
            userPlantsService.addUserPlant(requestDTO, images, userId);
            activityLogService.logActivity(userId.intValue(), "ADD_USER_PLANT",
                    "Added plant to user collection: " + requestDTO.getPlantId(), request);

            return new ResponseData<>(HttpStatus.OK.value(), "Plant added to user collection successfully");
        } catch (Exception e) {
            log.error("Error adding user plant: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to add plant to user collection: " + e.getMessage());
        }
    }

    @GetMapping("/user-plants/{filename}")
    public ResponseEntity<Resource> getUserPlantImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/user-plants/").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update")
    public ResponseData<?> updateUserPlant(
            @RequestBody UpdateUserPlantRequestDTO requestDTO,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        try {
            userPlantsService.updateUserPlant(requestDTO, userId);

            // Log the activity
            activityLogService.logActivity(userId.intValue(), "UPDATE_USER_PLANT",
                    "Updated user plant with ID: " + requestDTO.getUserPlantId(), request);

            return new ResponseData<>(HttpStatus.OK.value(), "User plant updated successfully");
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to update user plant: " + e.getMessage());
        }
    }

    @Operation(method = "POST", summary = "Create new plant", description = "Create a new plant and add to user collection")
    @PostMapping("/create-new-plant")
    public ResponseData<UserPlantResponseDTO> createNewPlant(
            @Valid @RequestBody CreateUserPlantRequestDTO request,
            HttpServletRequest httpRequest) {

        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }

        log.info("Creating new plant for user: {}", userId);

        try {
            if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
                validateImageUrls(request.getImageUrls());
            }

            UserPlantResponseDTO result = userPlantsService.createNewPlant(request, userId);

            activityLogService.logActivity(userId.intValue(), "CREATE_NEW_PLANT",
                    "Created new plant: " + request.getCommonName(), httpRequest);

            return new ResponseData<>(HttpStatus.CREATED.value(),
                    "Plant created and added to collection successfully", result);

        } catch (ValidationException e) {
            log.error("Validation failed for new plant: {}", e.getMessage());
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        } catch (RateLimitExceededException e) {
            log.error("Rate limit exceeded for user: {}", userId);
            return new ResponseError(HttpStatus.TOO_MANY_REQUESTS.value(), e.getMessage());
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found: {}", e.getMessage());
            return new ResponseError(HttpStatus.NOT_FOUND.value(), e.getMessage());
        } catch (Exception e) {
            log.error("Failed to create new plant", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to create new plant");
        }
    }

    private void validateImageUrls(List<String> imageUrls) {
        for (String url : imageUrls) {
            if (url == null || url.trim().isEmpty()) {
                throw new ValidationException("Image URL cannot be empty");
            }
            if (!url.startsWith("/api/user-plants/user-plants/")) {
                throw new ValidationException("Invalid image URL format");
            }
        }
    }
    @Operation(method = "POST", summary = "Upload plant image", description = "Upload image for user plant")
    @PostMapping("/upload-plant-image")
    public ResponseEntity<ResponseData<String>> uploadPlantImage(
            @RequestParam("image") MultipartFile image,
            HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.badRequest()
                    .body(new ResponseData<>(400, "User not authenticated", null));
        }
        try {
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ResponseData<>(400, "File is empty", null));
            }

            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(new ResponseData<>(400, "File must be an image", null));
            }

            if (image.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(new ResponseData<>(400, "File size must be less than 5MB", null));
            }

            String uploadDir = "uploads/user-plants/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = image.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(image.getInputStream(), filePath);

            String imageUrl = "/api/user-plants/user-plants/" + newFilename;

            return ResponseEntity.ok(new ResponseData<>(200, "Upload thành công", imageUrl));

        } catch (Exception e) {
            log.error("Failed to upload plant image for user: {}", userId, e);
            return ResponseEntity.internalServerError()
                    .body(new ResponseData<>(500, "Upload thất bại: " + e.getMessage(), null));
        }
    }
}
