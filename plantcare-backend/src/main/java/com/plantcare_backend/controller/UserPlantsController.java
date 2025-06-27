package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.UserPlantsSearchResponseDTO;
import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.reponse.ResponseError;
import com.plantcare_backend.dto.request.userPlants.UserPlantsSearchRequestDTO;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.service.UserPlantsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user-plants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "UserPlants Controller", description = "APIs for user plants management")
public class UserPlantsController {
    private final UserPlantsService userPlantsService;

    @Operation(method = "GET", summary = "Search user plants", description = "Search user plants by various criteria with pagination")
    @GetMapping("/search")
    public ResponseData<UserPlantsSearchResponseDTO> searchUserPlants(@Valid @ModelAttribute UserPlantsSearchRequestDTO request) {
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
    @GetMapping
    public ResponseData<List<UserPlants>> getAllUserPlants() {
        log.info("Request get all user plants");
        try {
            List<UserPlants> userPlants = userPlantsService.getAllUserPlants();
            return new ResponseData<>(HttpStatus.OK.value(), "Get user plants successfully", userPlants);
        } catch (Exception e) {
            log.error("Get user plants failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get user plants failed: " + e.getMessage());
        }
    }
}
