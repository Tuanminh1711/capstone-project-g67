package com.plantcare_backend.controller.ai_disease;

import com.plantcare_backend.annotation.VIPOnly;
import com.plantcare_backend.dto.request.ai_disease.DiseaseDetectionRequestDTO;
import com.plantcare_backend.dto.response.ai_disease.*;
import com.plantcare_backend.model.PlantDisease;
import com.plantcare_backend.service.AIDiseaseDetectionService;
import com.plantcare_backend.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/vip/disease-detection")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Disease Detection", description = "APIs for AI-powered plant disease detection")
@CrossOrigin(origins = "http://localhost:4200/")
public class AIDiseaseDetectionController {
    private final AIDiseaseDetectionService aiDiseaseDetectionService;
    private final ActivityLogService activityLogService;

    @PostMapping(value = "/detect-from-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @VIPOnly
    @Operation(summary = "Detect disease from image", description = "Upload plant image for AI disease detection")
    public ResponseEntity<DiseaseDetectionResultDTO> detectDiseaseFromImage(
            @Parameter(description = "Plant image file")
            @RequestParam("image") MultipartFile image,
            @RequestAttribute("userId") Long userId) {

        try {
            log.info("Received disease detection request from user: {} with image: name={}, size={}, contentType={}", 
                    userId, image.getOriginalFilename(), image.getSize(), image.getContentType());

            ValidationResult validationResult = validateImageForMobile(image);
            if (!validationResult.isValid()) {
                log.warn("Image validation failed: {}", validationResult.getErrorMessage());
                return ResponseEntity.badRequest().body(DiseaseDetectionResultDTO.builder()
                        .detectedDisease("Validation Error")
                        .confidenceScore(0.0)
                        .severity("LOW")
                        .symptoms("Lỗi validation: " + validationResult.getErrorMessage())
                        .recommendedTreatment("Vui lòng kiểm tra lại ảnh và thử lại")
                        .detectionMethod("ERROR")
                        .aiModelVersion("2.0.0")
                        .build());
            }

            DiseaseDetectionResultDTO result = aiDiseaseDetectionService.detectDiseaseFromImage(image, userId);

            activityLogService.logActivity(Math.toIntExact(userId), "DISEASE_DETECTION",
                    "Detected disease: " + result.getDetectedDisease() + " with confidence: " + result.getConfidenceScore());

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error in disease detection for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(DiseaseDetectionResultDTO.builder()
                    .detectedDisease("Validation Error")
                    .confidenceScore(0.0)
                    .severity("LOW")
                    .symptoms("Lỗi validation: " + e.getMessage())
                    .recommendedTreatment("Vui lòng kiểm tra lại ảnh và thử lại")
                    .detectionMethod("ERROR")
                    .aiModelVersion("2.0.0")
                    .build());
        } catch (Exception e) {
            log.error("Error in disease detection from image for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(DiseaseDetectionResultDTO.builder()
                    .detectedDisease("System Error")
                    .confidenceScore(0.0)
                    .severity("LOW")
                    .symptoms("Lỗi hệ thống: " + e.getMessage())
                    .recommendedTreatment("Vui lòng thử lại sau hoặc liên hệ hỗ trợ")
                    .detectionMethod("ERROR")
                    .aiModelVersion("2.0.0")
                    .build());
        }
    }

    private ValidationResult validateImageForMobile(MultipartFile image) {
        if (image.isEmpty()) {
            return ValidationResult.invalid("Image file is required");
        }

        long maxSize = 25 * 1024 * 1024; // 25MB for mobile images
        if (image.getSize() > maxSize) {
            return ValidationResult.invalid("Image size must be less than 25MB");
        }

        try {
            BufferedImage bufferedImage = ImageIO.read(image.getInputStream());
            if (bufferedImage != null) {
                int width = bufferedImage.getWidth();
                int height = bufferedImage.getHeight();
                int maxPixels = 1920 * 1080; // ~2MP limit

                log.info("Image dimensions: {}x{} ({} pixels). Max allowed: {} pixels",
                        width, height, width * height, maxPixels);

                if (width * height > maxPixels) {
                    log.warn("Image resolution too large: {}x{} ({} pixels). Max allowed: {} pixels",
                            width, height, width * height, maxPixels);
                    return ValidationResult.invalid(
                            String.format("Image resolution too large (%dx%d). Maximum allowed: 1920x1080 pixels",
                                    width, height)
                    );
                }
            }
        } catch (IOException e) {
            log.warn("Could not read image dimensions: {}", e.getMessage());
        }

        String contentType = image.getContentType();
        if (contentType == null) {
            String filename = image.getOriginalFilename();
            if (filename != null) {
                String extension = getFileExtension(filename);
                if (isValidImageExtension(extension)) {
                    contentType = "image/" + extension;
                    log.info("Inferred content type from extension: {} -> {}", extension, contentType);
                }
            }
        }

        if (contentType == null || !isValidImageContentType(contentType)) {
            log.warn("Invalid content type: {}", contentType);
            return ValidationResult.invalid("File must be a valid image (JPEG, PNG, GIF, WebP, HEIC)");
        }

        String filename = image.getOriginalFilename();
        if (filename != null) {
            String extension = getFileExtension(filename);
            if (!isValidImageExtension(extension)) {
                log.warn("Invalid file extension: {}", extension);
                return ValidationResult.invalid("File extension not supported. Please use JPEG, PNG, GIF, WebP, or HEIC");
            }
        }

        log.info("Image validation passed for: {} (type: {}, size: {} bytes)",
                filename, contentType, image.getSize());
        return ValidationResult.valid();
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private boolean isValidImageExtension(String extension) {
        return Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "heic", "heif").contains(extension);
    }

    private boolean isValidImageContentType(String contentType) {
        return contentType.startsWith("image/") &&
                (contentType.contains("jpeg") || contentType.contains("png") ||
                        contentType.contains("gif") || contentType.contains("webp") ||
                        contentType.contains("heic") || contentType.contains("heif"));
    }

    private static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }


    @PostMapping("/detect-from-symptoms")
    @VIPOnly
    @Operation(summary = "Detect disease from symptoms", description = "Analyze plant symptoms for disease detection")
    public ResponseEntity<DiseaseDetectionResultDTO> detectDiseaseFromSymptoms(
            @RequestBody DiseaseDetectionRequestDTO request,
            @RequestAttribute("userId") Long userId) {

        log.info("Disease detection request from symptoms for user: {}", userId);

        try {
            DiseaseDetectionResultDTO result = aiDiseaseDetectionService.detectDiseaseFromSymptoms(request, userId);

            // Log activity
            activityLogService.logActivity(Math.toIntExact(userId), "DISEASE_DETECTION",
                    "Detected disease from symptoms: " + result.getDetectedDisease());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in disease detection from symptoms", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/common-diseases")
    @VIPOnly
    @Operation(summary = "Get common diseases", description = "Get list of common diseases for plant type")
    public ResponseEntity<List<PlantDisease>> getCommonDiseases(
            @Parameter(description = "Plant type")
            @RequestParam("plantType") String plantType) {

        try {
            List<PlantDisease> diseases = aiDiseaseDetectionService.getCommonDiseases(plantType);
            return ResponseEntity.ok(diseases);
        } catch (Exception e) {
            log.error("Error getting common diseases", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/treatment-guide")
    @VIPOnly
    @Operation(summary = "Get treatment guide", description = "Get detailed treatment guide for specific disease")
    public ResponseEntity<TreatmentGuideDTO> getTreatmentGuide(
            @Parameter(description = "Disease name") @RequestParam("diseaseName") String diseaseName) {

        try {
            TreatmentGuideDTO guide = aiDiseaseDetectionService.getTreatmentGuide(diseaseName);
            return ResponseEntity.ok(guide);
        } catch (Exception e) {
            log.error("Error getting treatment guide", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/history")
    @VIPOnly
    @Operation(summary = "Get detection history", description = "Get paginated detection history for user")
    public ResponseEntity<Page<DiseaseDetectionHistoryDTO>> getDetectionHistory(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @RequestAttribute("userId") Long userId) {

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<DiseaseDetectionHistoryDTO> history = aiDiseaseDetectionService.getDetectionHistory(userId, pageable);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting detection history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @VIPOnly
    @Operation(summary = "Search diseases", description = "Search diseases by keyword")
    public ResponseEntity<List<PlantDisease>> searchDiseases(
            @Parameter(description = "Search keyword") @RequestParam("keyword") String keyword) {

        try {
            List<PlantDisease> diseases = aiDiseaseDetectionService.searchDiseases(keyword);
            return ResponseEntity.ok(diseases);
        } catch (Exception e) {
            log.error("Error searching diseases", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-category")
    @VIPOnly
    @Operation(summary = "Get diseases by category", description = "Get diseases filtered by category")
    public ResponseEntity<List<PlantDisease>> getDiseasesByCategory(
            @Parameter(description = "Disease category") @RequestParam("category") String category) {

        try {
            List<PlantDisease> diseases = aiDiseaseDetectionService.getDiseasesByCategory(category);
            return ResponseEntity.ok(diseases);
        } catch (Exception e) {
            log.error("Error getting diseases by category", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-severity")
    @VIPOnly
    @Operation(summary = "Get diseases by severity", description = "Get diseases filtered by severity")
    public ResponseEntity<List<PlantDisease>> getDiseasesBySeverity(
            @Parameter(description = "Disease severity") @RequestParam("severity") String severity) {

        try {
            List<PlantDisease> diseases = aiDiseaseDetectionService.getDiseasesBySeverity(severity);
            return ResponseEntity.ok(diseases);
        } catch (Exception e) {
            log.error("Error getting diseases by severity", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{diseaseId}")
    @VIPOnly
    @Operation(summary = "Get disease by ID", description = "Get specific disease details by ID")
    public ResponseEntity<PlantDisease> getDiseaseById(
            @Parameter(description = "Disease ID") @PathVariable Long diseaseId) {

        try {
            PlantDisease disease = aiDiseaseDetectionService.getDiseaseById(diseaseId);
            return ResponseEntity.ok(disease);
        } catch (Exception e) {
            log.error("Error getting disease by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
