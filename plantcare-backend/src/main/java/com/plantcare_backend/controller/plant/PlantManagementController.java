package com.plantcare_backend.controller.plant;

import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.base.ResponseSuccess;
import com.plantcare_backend.dto.response.plantsManager.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportDetailResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.*;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.service.PlantManagementService;
import com.plantcare_backend.service.PlantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
public class PlantManagementController {
    @Autowired
    private final PlantManagementService plantManagementService;
    @Autowired
    private final PlantService plantService;

    //not use
    @PostMapping("/create-plant")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<Long> createPlantManager(
            @Valid @RequestBody CreatePlantManagementRequestDTO createPlantManagementRequestDTO,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        try {
            Long plantId = plantManagementService.createPlantByManager(createPlantManagementRequestDTO, userId);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Plant created successfully", plantId);
        } catch (ResourceNotFoundException e) {
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }
    // up load anh cho plant
    @PostMapping("/upload-plant-image")
    public ResponseEntity<ResponseData<String>> uploadPlantImage(@RequestParam("image") MultipartFile image) {
        try {
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File is empty", null));
            }
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File must be an image", null));
            }
            if (image.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File size must be less than 5MB", null));
            }
            String uploadDir = "uploads/plants/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = image.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(image.getInputStream(), filePath);
            String imageUrl = "/api/plants/" + newFilename;
            return ResponseEntity.ok(new ResponseData<>(200, "Upload thành công", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ResponseData<>(500, "Upload thất bại: " + e.getMessage(), null));
        }
    }
    // trích xuất ảnh
    @GetMapping("/plants/{filename}")
    public ResponseEntity<Resource> getPlantImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/plants/").resolve(filename);
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

    //not use
    @GetMapping("/get-all-plants")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
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
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<Page<PlantListResponseDTO>> searchPlants(
            @RequestBody PlantSearchRequestDTO requestDTO) {
        Page<PlantListResponseDTO> result = plantManagementService.searchPlants(requestDTO);
        return new ResponseData<>(HttpStatus.OK.value(), "Search plant list successfully", result);
    }

    @GetMapping("/plant-detail/{id}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseData<PlantDetailResponseDTO> getPlantDetail(@PathVariable Long id) {
        PlantDetailResponseDTO dto = plantService.getPlantDetail(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Get plant detail successfully", dto);
    }

    @PutMapping("/update-plant/{id}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
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
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Update plant failed: " + e.getMessage(), null);
        }
    }

    @PostMapping("/lock-unlock")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> lockOrUnlockPlant(@RequestBody LockUnlockPlantRequestDTO lockUnlockPlantRequestDTO) {
        Plants.PlantStatus status = plantManagementService.lockOrUnlockPlant(
                lockUnlockPlantRequestDTO.getPlantId(),
                lockUnlockPlantRequestDTO.isLock());
        String message = (status == Plants.PlantStatus.INACTIVE) ? "Đã khoá cây cây" : "Đã mở khóa cây";
        return ResponseEntity.ok(new ResponseData<>(HttpStatus.OK.value(), "Lock unlock successfully", message));
    }

    @GetMapping("/report-list")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getReportList(
            @ModelAttribute PlantReportSearchRequestDTO request) {
        try {
            PlantReportListResponseDTO response = plantManagementService.getReportList(request);
            return ResponseEntity
                    .ok(new ResponseData<>(HttpStatus.OK.value(), "get report list successfully", response));
        } catch (ResourceNotFoundException e) {
            ResponseError error = new ResponseError(HttpStatus.BAD_REQUEST.value(), "get report failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

    }

    // nhận báo cáo của admin or staff. để xử lý report.
    @PutMapping("/claim-report/{reportId}")
    public ResponseEntity<?> claimReport(
            @PathVariable Long reportId,
            @RequestHeader("userId") Integer userId) {
        plantManagementService.claimReport(reportId, userId);
        return ResponseEntity.ok(new ResponseSuccess(HttpStatus.OK, "Nhận xử lý báo cáo thành công!"));
    }

    // xác nhận khi xử lý xong.
    @PutMapping("/handle-report/{reportId}")
    public ResponseEntity<?> handleReport(
            @PathVariable Long reportId,
            @RequestBody HandleReportRequestDTO request,
            @RequestHeader("userId") Integer userId) {
        plantManagementService.handleReport(reportId, request.getStatus(), request.getAdminNotes(), userId);
        return ResponseEntity.ok(new ResponseSuccess(HttpStatus.OK, "Xử lý báo cáo thành công!"));
    }

    @GetMapping("/report-detail/{reportId}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getReportDetail(
            @PathVariable Long reportId) {
        try {
            PlantReportDetailResponseDTO response = plantManagementService.getReportDetail(reportId);
            return ResponseEntity
                    .ok(new ResponseData<>(HttpStatus.OK.value(), "Get report detail successfully", response));
        } catch (ResourceNotFoundException e) {
            ResponseError error = new ResponseError(HttpStatus.NOT_FOUND.value(),
                    "Report not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            ResponseError error = new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to get report detail: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

}