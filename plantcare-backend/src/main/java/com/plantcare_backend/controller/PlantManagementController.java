package com.plantcare_backend.controller;

import com.plantcare_backend.dto.reponse.ResponseData;
import com.plantcare_backend.dto.reponse.ResponseError;
import com.plantcare_backend.dto.reponse.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.reponse.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.CreatePlantManagementRequestDTO;
import com.plantcare_backend.dto.request.plantsManager.PlantSearchRequestDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.service.AdminService;
import com.plantcare_backend.service.PlantManagementService;
import com.plantcare_backend.service.PlantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class PlantManagementController {
    private final PlantManagementService plantManagementService;
    private final PlantService plantService;
    private final AdminService adminService;

    @PostMapping("/create-plant")
    public ResponseData<Long> createPlantManager(
            @Valid @RequestBody CreatePlantManagementRequestDTO createPlantManagementRequestDTO) {
        try {
            Long plantId = plantManagementService.createPlantByManager(createPlantManagementRequestDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Plant created successfully", plantId);
        }catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }

    }

    @GetMapping("/get-all-plants")
    public ResponseData<Page<PlantListResponseDTO>> getAllPlants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<PlantListResponseDTO> plants = plantManagementService.getAllPlants(page, size);
            return new ResponseData<>(HttpStatus.OK.value(), "Plants retrieved successfully", plants);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get plants");
        }
    }

    @PostMapping("/search-plants")
    public ResponseData<Page<PlantListResponseDTO>> searchPlants(
            @RequestBody PlantSearchRequestDTO requestDTO) {
        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);
        return new ResponseData<>(HttpStatus.OK.value(), "Search plant list successfully", result);
    }

    @GetMapping("/plant-detail/{id}")
    public ResponseData<PlantDetailResponseDTO> getPlantDetail(@PathVariable Long id) {
        PlantDetailResponseDTO dto = plantService.getPlantDetail(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Get plant detail successfully", dto);
    }
}
