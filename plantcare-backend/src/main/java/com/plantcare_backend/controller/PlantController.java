package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.PlantSearchResponseDTO;
import com.plantcare_backend.dto.reponse.Plants.UserPlantDetailResponseDTO;
import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.reponse.ResponseError;
import com.plantcare_backend.dto.reponse.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantCategory;
import com.plantcare_backend.service.PlantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho chức năng tìm kiếm và quản lý cây
 * Tất cả User/Staff/Admin đều có thể sử dụng
 */
@RestController
@RequestMapping("/api/plants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Plant Controller", description = "APIs for plant search and management")
@CrossOrigin(origins = "http://localhost:4200/")
public class PlantController {

    private final PlantService plantService;

    /**
     * Tìm kiếm cây theo các tiêu chí
     * 
     * @param request DTO chứa các tiêu chí tìm kiếm
     * @return Kết quả tìm kiếm với phân trang
     */
    @Operation(method = "GET", summary = "Search plants", description = "Search plants by various criteria with pagination")
    @GetMapping("/search")
    public ResponseData<PlantSearchResponseDTO> searchPlants(@Valid @ModelAttribute PlantSearchRequestDTO request) {
        log.info("Request search plants with criteria: {}", request);
        try {
            PlantSearchResponseDTO result = plantService.searchPlants(request);
            return new ResponseData<>(HttpStatus.OK.value(), "Search plants successfully", result);
        } catch (Exception e) {
            log.error("Search plants failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Search plants failed: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách tất cả categories
     * 
     * @return Danh sách categories
     */
    @Operation(method = "GET", summary = "Get all categories", description = "Get list of all plant categories")
    @GetMapping("/categories")
    public ResponseData<List<PlantCategory>> getAllCategories() {
        log.info("Request get all plant categories");

        try {
            List<PlantCategory> categories = plantService.getAllCategories();
            return new ResponseData<>(HttpStatus.OK.value(), "Get categories successfully", categories);
        } catch (Exception e) {
            log.error("Get categories failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get categories failed: " + e.getMessage());
        }
    }

    @GetMapping("/detail/{id}")
    public ResponseData<UserPlantDetailResponseDTO> getPlantDetailForUser(@PathVariable Long id) {
        PlantDetailResponseDTO fullDto = plantService.getPlantDetail(id);
        if (!"ACTIVE".equals(fullDto.getStatus())) {
            throw new ResourceNotFoundException("Plant not available");
        }
        UserPlantDetailResponseDTO userDto = plantService.toUserPlantDetailDTO(fullDto);
        return new ResponseData<>(HttpStatus.OK.value(), "Get plant detail successfully", userDto);
    }
}
