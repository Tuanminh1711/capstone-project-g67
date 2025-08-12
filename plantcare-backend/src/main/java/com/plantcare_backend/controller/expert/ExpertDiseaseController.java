package com.plantcare_backend.controller.expert;

import com.plantcare_backend.dto.request.expert.CreatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateTreatmentGuideRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.expert.PlantDiseaseDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.TreatmentGuideResponseDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.ExpertDiseaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expert/disease-management")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Expert Disease Management", description = "APIs for experts to manage plant diseases and treatment guides")
@CrossOrigin(origins = "http://localhost:4200/")
public class ExpertDiseaseController {

    private final ExpertDiseaseService expertDiseaseService;
    private final ActivityLogService activityLogService;

    // ==================== PLANT DISEASE MANAGEMENT ====================

    @PostMapping("/diseases")
    @Operation(summary = "Create new plant disease", description = "Expert creates a new plant disease")
    public ResponseData<PlantDiseaseDetailResponseDTO> createPlantDisease(
            @Valid @RequestBody CreatePlantDiseaseRequestDTO request,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} creating new plant disease: {}", expertId, request.getDiseaseName());

        try {
            PlantDiseaseDetailResponseDTO createdDisease = expertDiseaseService.createPlantDisease(request,
                    expertId.longValue());

            activityLogService.logActivity(expertId, "CREATE_PLANT_DISEASE",
                    "Expert created plant disease: " + request.getDiseaseName());

            return new ResponseData<>(HttpStatus.CREATED.value(), "Tạo bệnh cây thành công", createdDisease);

        } catch (InvalidDataException e) {
            log.error("Invalid data for plant disease creation, expertId: {}", expertId, e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Create plant disease failed, expertId: {}", expertId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Lỗi tạo bệnh cây: " + e.getMessage(),
                    null);
        }
    }

    @PutMapping("/diseases/{diseaseId}")
    @Operation(summary = "Update plant disease", description = "Expert updates an existing plant disease")
    public ResponseData<PlantDiseaseDetailResponseDTO> updatePlantDisease(
            @PathVariable Long diseaseId,
            @Valid @RequestBody UpdatePlantDiseaseRequestDTO request,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} updating plant disease: {}", expertId, diseaseId);

        try {
            PlantDiseaseDetailResponseDTO updatedDisease = expertDiseaseService.updatePlantDisease(diseaseId, request,
                    expertId.longValue());

            activityLogService.logActivity(expertId, "UPDATE_PLANT_DISEASE",
                    "Expert updated plant disease: " + request.getDiseaseName() + " with ID: " + diseaseId);

            return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật bệnh cây thành công", updatedDisease);

        } catch (ResourceNotFoundException e) {
            log.error("Plant disease not found for update, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (InvalidDataException e) {
            log.error("Invalid data for plant disease update, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Update plant disease failed, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi cập nhật bệnh cây: " + e.getMessage(), null);
        }
    }

    @DeleteMapping("/diseases/{diseaseId}")
    @Operation(summary = "Delete plant disease", description = "Expert soft deletes a plant disease")
    public ResponseData<String> deletePlantDisease(
            @PathVariable Long diseaseId,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} deleting plant disease: {}", expertId, diseaseId);

        try {
            expertDiseaseService.deletePlantDisease(diseaseId, expertId.longValue());

            activityLogService.logActivity(expertId, "DELETE_PLANT_DISEASE",
                    "Expert deleted plant disease with ID: " + diseaseId);

            return new ResponseData<>(HttpStatus.OK.value(), "Xóa bệnh cây thành công", "Bệnh cây đã được xóa");

        } catch (ResourceNotFoundException e) {
            log.error("Plant disease not found for deletion, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (InvalidDataException e) {
            log.error("Invalid operation for plant disease deletion, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Delete plant disease failed, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Lỗi xóa bệnh cây: " + e.getMessage(),
                    null);
        }
    }

    @GetMapping("/diseases/{diseaseId}")
    @Operation(summary = "Get plant disease by ID", description = "Expert gets detailed information of a specific plant disease")
    public ResponseData<PlantDiseaseDetailResponseDTO> getPlantDiseaseById(
            @PathVariable Long diseaseId) {

        log.info("Getting plant disease by ID: {}", diseaseId);

        try {
            PlantDiseaseDetailResponseDTO disease = expertDiseaseService.getPlantDiseaseById(diseaseId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lấy thông tin bệnh cây thành công", disease);

        } catch (ResourceNotFoundException e) {
            log.error("Plant disease not found, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Get plant disease failed, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi lấy thông tin bệnh cây: " + e.getMessage(), null);
        }
    }

    @GetMapping("/diseases")
    @Operation(summary = "Get all plant diseases", description = "Expert gets paginated list of all plant diseases")
    public ResponseData<Page<PlantDiseaseDetailResponseDTO>> getAllPlantDiseases(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {

        log.info("Getting all plant diseases, page: {}, size: {}", page, size);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PlantDiseaseDetailResponseDTO> diseases = expertDiseaseService.getAllPlantDiseases(pageable);
            return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách bệnh cây thành công", diseases);

        } catch (Exception e) {
            log.error("Get all plant diseases failed", e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi lấy danh sách bệnh cây: " + e.getMessage(), null);
        }
    }

    // ==================== TREATMENT GUIDE MANAGEMENT ====================

    @PostMapping("/diseases/{diseaseId}/treatment-guides")
    @Operation(summary = "Create treatment guide", description = "Expert creates a new treatment guide for a specific disease")
    public ResponseData<TreatmentGuideResponseDTO> createTreatmentGuide(
            @PathVariable Long diseaseId,
            @Valid @RequestBody CreateTreatmentGuideRequestDTO request,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} creating treatment guide for disease: {}", expertId, diseaseId);

        try {
            TreatmentGuideResponseDTO createdGuide = expertDiseaseService.createTreatmentGuide(diseaseId, request,
                    expertId.longValue());

            activityLogService.logActivity(expertId, "CREATE_TREATMENT_GUIDE",
                    "Expert created treatment guide: " + request.getTitle() + " for disease ID: " + diseaseId);

            return new ResponseData<>(HttpStatus.CREATED.value(), "Tạo hướng dẫn điều trị thành công", createdGuide);

        } catch (ResourceNotFoundException e) {
            log.error("Disease not found for treatment guide creation, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (InvalidDataException e) {
            log.error("Invalid data for treatment guide creation, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Create treatment guide failed, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi tạo hướng dẫn điều trị: " + e.getMessage(), null);
        }
    }

    @PutMapping("/treatment-guides/{guideId}")
    @Operation(summary = "Update treatment guide", description = "Expert updates an existing treatment guide")
    public ResponseData<TreatmentGuideResponseDTO> updateTreatmentGuide(
            @PathVariable Long guideId,
            @Valid @RequestBody CreateTreatmentGuideRequestDTO request,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} updating treatment guide: {}", expertId, guideId);

        try {
            TreatmentGuideResponseDTO updatedGuide = expertDiseaseService.updateTreatmentGuide(guideId, request,
                    expertId.longValue());

            activityLogService.logActivity(expertId, "UPDATE_TREATMENT_GUIDE",
                    "Expert updated treatment guide: " + request.getTitle() + " with ID: " + guideId);

            return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật hướng dẫn điều trị thành công", updatedGuide);

        } catch (ResourceNotFoundException e) {
            log.error("Treatment guide not found for update, guideId: {}", guideId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (InvalidDataException e) {
            log.error("Invalid data for treatment guide update, guideId: {}", guideId, e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Update treatment guide failed, guideId: {}", guideId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi cập nhật hướng dẫn điều trị: " + e.getMessage(), null);
        }
    }

    @DeleteMapping("/treatment-guides/{guideId}")
    @Operation(summary = "Delete treatment guide", description = "Expert deletes a treatment guide")
    public ResponseData<String> deleteTreatmentGuide(
            @PathVariable Long guideId,
            @RequestAttribute("userId") Integer expertId) {

        log.info("Expert {} deleting treatment guide: {}", expertId, guideId);

        try {
            expertDiseaseService.deleteTreatmentGuide(guideId, expertId.longValue());

            activityLogService.logActivity(expertId, "DELETE_TREATMENT_GUIDE",
                    "Expert deleted treatment guide with ID: " + guideId);

            return new ResponseData<>(HttpStatus.OK.value(), "Xóa hướng dẫn điều trị thành công",
                    "Hướng dẫn điều trị đã được xóa");

        } catch (ResourceNotFoundException e) {
            log.error("Treatment guide not found for deletion, guideId: {}", guideId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Delete treatment guide failed, guideId: {}", guideId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi xóa hướng dẫn điều trị: " + e.getMessage(), null);
        }
    }

    @GetMapping("/diseases/{diseaseId}/treatment-guides")
    @Operation(summary = "Get treatment guides by disease", description = "Expert gets all treatment guides for a specific disease")
    public ResponseData<List<TreatmentGuideResponseDTO>> getTreatmentGuidesByDisease(
            @PathVariable Long diseaseId) {

        log.info("Getting treatment guides for disease: {}", diseaseId);

        try {
            List<TreatmentGuideResponseDTO> guides = expertDiseaseService.getTreatmentGuidesByDisease(diseaseId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lấy hướng dẫn điều trị thành công", guides);

        } catch (ResourceNotFoundException e) {
            log.error("Disease not found for treatment guides, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            log.error("Get treatment guides failed, diseaseId: {}", diseaseId, e);
            return new ResponseData<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi lấy hướng dẫn điều trị: " + e.getMessage(), null);
        }
    }
}


