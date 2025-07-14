package com.plantcare_backend.controller.user;

import com.plantcare_backend.dto.request.userPlants.CreateUserPlantRequestDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.response.userPlants.UserPlantListResponseDTO;
import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.response.ResponseError;
import com.plantcare_backend.dto.response.ResponseSuccess;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.dto.request.userPlants.AddUserPlantRequestDTO;
import com.plantcare_backend.dto.request.userPlants.UpdateUserPlantRequestDTO;
import com.plantcare_backend.exception.RateLimitExceededException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.exception.ValidationException;
import com.plantcare_backend.service.UserPlantsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-plants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "UserPlants Controller", description = "APIs for user plants management")
@CrossOrigin(origins = "http://localhost:4200/")
public class UserPlantsController {
    private final UserPlantsService userPlantsService;

    @Operation(method = "GET", summary = "Search user plants", description = "Search user plants by various criteria with pagination")
    @GetMapping("/search")
    public ResponseData<UserPlantsSearchResponseDTO> searchUserPlants(@Valid @ModelAttribute UserPlantsSearchRequestDTO request, HttpServletRequest httpRequest) {
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
            @RequestBody AddUserPlantRequestDTO requestDTO,
            HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        try {
            userPlantsService.addUserPlant(requestDTO, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Plant added to user collection successfully");
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to add plant to user collection: " + e.getMessage());
        }
    }

    @PutMapping("/update")
    public ResponseData<?> updateUserPlant(
            @RequestBody UpdateUserPlantRequestDTO requestDTO,
            HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
        }
        try {
            userPlantsService.updateUserPlant(requestDTO, userId);
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
            UserPlantResponseDTO result = userPlantsService.createNewPlant(request, userId);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Plant created and added to collection successfully", result);
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
}
