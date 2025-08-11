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
            DiseaseDetectionResultDTO result = aiDiseaseDetectionService.detectDiseaseFromImage(image, userId);

            activityLogService.logActivity(Math.toIntExact(userId), "DISEASE_DETECTION",
                    "Detected disease: " + result.getDetectedDisease() + " with confidence: " + result.getConfidenceScore());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in disease detection from image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
