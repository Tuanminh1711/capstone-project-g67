package com.plantcare_backend.controller.plant;

import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.base.ResponseSuccess;
import com.plantcare_backend.dto.response.Plants.PlantDetailResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportListResponseDTO;
import com.plantcare_backend.dto.response.plantsManager.PlantReportDetailResponseDTO;
import com.plantcare_backend.dto.request.plantsManager.*;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantImage;
import com.plantcare_backend.model.Plants;
import com.plantcare_backend.repository.PlantImageRepository;
import com.plantcare_backend.repository.PlantRepository;
import com.plantcare_backend.service.AzureStorageService;
import com.plantcare_backend.service.PlantManagementService;
import com.plantcare_backend.service.PlantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
@Slf4j
public class PlantManagementController {
    @Autowired
    private final PlantManagementService plantManagementService;
    @Autowired
    private final PlantService plantService;
    @Autowired
    private final PlantRepository plantRepository;
    @Autowired
    private final PlantImageRepository plantImageRepository;
    @Autowired
    private AzureStorageService azureStorageService;

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
    @PostMapping("/upload-plant-image/{plantId}")
    public ResponseEntity<ResponseData<String>> uploadPlantImageForPlant(
            @PathVariable Long plantId,
            @RequestParam("image") MultipartFile image,
            HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");

        try {
            // 1. Validate plant exists
            Plants plant = plantRepository.findById(plantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Plant not found with id: " + plantId));

            // 2. Validate file
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File is empty", null));
            }

            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File must be an image", null));
            }

            if (image.getSize() > 20 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File size must be less than 20MB", null));
            }

            // 3. Upload file
            String originalFilename = image.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            String path = "plants/" + plantId + "/" + newFilename;
            String imageUrl = azureStorageService.uploadFile(image, path);

            // 4. Add image to plant database
            PlantImage plantImage = PlantImage.builder()
                    .plant(plant)
                    .imageUrl(imageUrl)
                    .isPrimary(false) // Default to false, can be set later
                    .build();

            plantImageRepository.save(plantImage);

            // 5. Log tracking
            log.info("Uploaded image for plant ID: {}, filename: {}, uploaded by user: {}",
                    plantId, newFilename, userId);

            return ResponseEntity.ok(new ResponseData<>(200,
                    "Upload thành công cho plant: " + plant.getCommonName(), imageUrl));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(new ResponseData<>(400, e.getMessage(), null));
        } catch (Exception e) {
            log.error("Upload failed for plant ID: {}", plantId, e);
            return ResponseEntity.internalServerError().body(new ResponseData<>(500, "Upload thất bại: " + e.getMessage(), null));
        }
    }

    @PutMapping("/update-plant-images/{plantId}")
    public ResponseEntity<ResponseData<PlantDetailResponseDTO>> updatePlantImages(
            @PathVariable Long plantId,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "deleteImageIds", required = false) List<Long> deleteImageIds,
            @RequestParam(value = "setPrimaryImageId", required = false) Long setPrimaryImageId,
            HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");

        try {
            Plants plant = plantRepository.findById(plantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Plant not found with id: " + plantId));

            // 1. Delete images
            if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
                List<PlantImage> imagesToDelete = plantImageRepository.findAllById(deleteImageIds);
                for (PlantImage image : imagesToDelete) {
                    if (image.getPlant().getId().equals(plantId)) {
                        try {
                            // Xóa file từ Azure Storage
                            azureStorageService.deleteFile(image.getImageUrl());
                            log.info("Deleted image from Azure: {}", image.getImageUrl());
                        } catch (Exception e) {
                            log.warn("Could not delete file from Azure: {}", image.getImageUrl(), e);
                        }
                    }
                }
                plantImageRepository.deleteAll(imagesToDelete);
                log.info("Deleted {} images for plant ID: {}", imagesToDelete.size(), plantId);
            }

            // 2. Upload new images
            if (images != null && !images.isEmpty()) {
                for (MultipartFile image : images) {
                    if (image == null || image.isEmpty()) {
                        continue;
                    }

                    String contentType = image.getContentType();
                    if (contentType == null || !contentType.startsWith("image/")) {
                        continue;
                    }

                    if (image.getSize() > 20 * 1024 * 1024) {
                        continue;
                    }

                    String originalFilename = image.getOriginalFilename();
                    String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String newFilename = UUID.randomUUID().toString() + fileExtension;

                    // Sử dụng Azure Storage thay vì local
                    String path = "plants/" + plantId + "/" + newFilename;
                    String imageUrl = azureStorageService.uploadFile(image, path);

                    PlantImage plantImage = PlantImage.builder()
                            .plant(plant)
                            .imageUrl(imageUrl)
                            .isPrimary(false)
                            .build();

                    plantImageRepository.save(plantImage);
                    log.info("Added new image for plant ID: {}, filename: {}", plantId, newFilename);
                }
            }

            // 3. Set primary image
            if (setPrimaryImageId != null) {
                List<PlantImage> allImages = plantImageRepository.findByPlantId(plantId);
                for (PlantImage image : allImages) {
                    image.setIsPrimary(false);
                }

                PlantImage primaryImage = plantImageRepository.findById(setPrimaryImageId)
                        .orElse(null);
                if (primaryImage != null && primaryImage.getPlant().getId().equals(plantId)) {
                    primaryImage.setIsPrimary(true);
                    plantImageRepository.save(primaryImage);
                    log.info("Set image ID: {} as primary for plant ID: {}", setPrimaryImageId, plantId);
                }
            }

            // 4. Get updated plant details
            PlantDetailResponseDTO updatedPlant = plantManagementService.getPlantDetail(plantId);

            return ResponseEntity.ok(new ResponseData<>(200,
                    "Plant images updated successfully", updatedPlant));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(new ResponseData<>(400, e.getMessage(), null));
        } catch (Exception e) {
            log.error("Update plant images failed for plant ID: {}", plantId, e);
            return ResponseEntity.internalServerError().body(new ResponseData<>(500,
                    "Update plant images failed: " + e.getMessage(), null));
        }
    }

    // trích xuất ảnh
    @GetMapping("/plants/{filename}")
    public ResponseEntity<Resource> getPlantImage(@PathVariable String filename) {
        try {
            // Sử dụng Azure Storage thay vì local
            String azureUrl = azureStorageService.generateBlobUrl("plants/" + filename);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, azureUrl)
                    .build();
        } catch (Exception e) {
            log.error("Error generating Azure URL for image: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }

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