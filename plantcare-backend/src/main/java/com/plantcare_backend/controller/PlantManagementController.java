package com.plantcare_backend.controller;

import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.response.ResponseError;
import com.plantcare_backend.dto.response.ResponseSuccess;
import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportListResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.*;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.PlantManagementService;
import com.plantcare_backend.service.PlantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class PlantManagementController {
    @Autowired
    private final PlantManagementService plantManagementService;
    @Autowired
    private final PlantService plantService;


    @PostMapping("/create-plant")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<Long> createPlantManager(
            @Valid @RequestBody CreatePlantManagementRequestDTO createPlantManagementRequestDTO) {
        try {
            Long plantId = plantManagementService.createPlantByManager(createPlantManagementRequestDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Plant created successfully", plantId);
        } catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }

    }

    @GetMapping("/get-all-plants")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<Page<PlantListResponseDTO>> getAllPlants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<PlantListResponseDTO> plants = plantManagementService.getAllPlants(page, size);
            return new ResponseData<>(HttpStatus.OK.value(), "Plants Get successfully", plants);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to get plants");
        }
    }

    @PostMapping("/search-plants")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<Page<PlantListResponseDTO>> searchPlants(
            @RequestBody PlantSearchRequestDTO requestDTO) {
        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);
        return new ResponseData<>(HttpStatus.OK.value(), "Search plant list successfully", result);
    }

    @GetMapping("/plant-detail/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<PlantDetailResponseDTO> getPlantDetail(@PathVariable Long id) {
        PlantDetailResponseDTO dto = plantService.getPlantDetail(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Get plant detail successfully", dto);
    }

    @PutMapping("/update-plant/{id}")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<PlantDetailResponseDTO> updatePlant(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlantRequestDTO updateRequest) {
        try {
            PlantDetailResponseDTO updatedPlant = plantManagementService.updatePlant(id, updateRequest);
            return new ResponseData<>(HttpStatus.OK.value(), "Plant updated successfully", updatedPlant);
        } catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (IllegalArgumentException e) {
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Invalid enum value: " + e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Update plant failed: " + e.getMessage(), null);
        }
    }

    @PostMapping("/lock-unlock")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> lockOrUnlockPlant(@RequestBody LockUnlockPlantRequestDTO lockUnlockPlantRequestDTO) {
        Plants.PlantStatus status = plantManagementService.lockOrUnlockPlant(
                lockUnlockPlantRequestDTO.getPlantId(),
                lockUnlockPlantRequestDTO.isLock()
        );
        String message = (status == Plants.PlantStatus.INACTIVE) ? "Đã khoá cây cây" : "Đã mở khóa cây";
        return ResponseEntity.ok(new ResponseData<>(HttpStatus.OK.value(), "Lock unlock successfully", message));
    }

    @GetMapping("/report-list")
    //@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ResponseData<PlantReportListResponseDTO>> getReportList(
            @ModelAttribute PlantReportSearchRequestDTO request) {
        try {
            PlantReportListResponseDTO response = plantManagementService.getReportList(request);
            return ResponseEntity.ok(new ResponseData<>(HttpStatus.OK.value(), "get report list successfully", response));
        } catch (ResourceNotFoundException e) {
            ResponseError error = new ResponseError(HttpStatus.BAD_REQUEST.value(), "get report failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

    }

    // nhận báo cáo của admin or staff. để xử lý report.
    @PutMapping("/claim-report/{reportId}")
    public ResponseEntity<?> claimReport(
            @PathVariable Long reportId,
            @RequestHeader("userId") Integer userId
    ) {
        plantManagementService.claimReport(reportId, userId);
        return ResponseEntity.ok(new ResponseSuccess(HttpStatus.OK, "Nhận xử lý báo cáo thành công!"));
    }

    //xác nhận khi xử lý xong.
    @PutMapping("/handle-report/{reportId}")
    public ResponseEntity<?> handleReport(
            @PathVariable Long reportId,
            @RequestBody HandleReportRequestDTO request,
            @RequestHeader("userId") Integer userId
    ) {
        plantManagementService.handleReport(reportId, request.getStatus(), request.getAdminNotes(), userId);
        return ResponseEntity.ok(new ResponseSuccess(HttpStatus.OK, "Xử lý báo cáo thành công!"));
    }

}