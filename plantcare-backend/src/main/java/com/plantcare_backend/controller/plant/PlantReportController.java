package com.plantcare_backend.controller.plant;

import com.plantcare_backend.dto.request.plantsManager.PlantReportRequestDTO;
import com.plantcare_backend.dto.response.Plants.UserReportListResponseDTO;
import com.plantcare_backend.dto.response.Plants.UserReportResponseDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.base.ResponseSuccess;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.service.PlantService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plants-report")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Plant report Controller", description = "APIs for plant report and management")
@CrossOrigin(origins = "http://localhost:4200/")
public class PlantReportController {
    @Autowired
    private final PlantService plantService;

    @PostMapping("/reason")
    //@PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> reportPlant(@RequestBody PlantReportRequestDTO request,
                                         @RequestAttribute("userId") Long userId) {
        plantService.reportPlant(request, userId);
        return ResponseEntity.ok(new ResponseSuccess(HttpStatus.CREATED, "báo cáo của bạn đã được ghi nhận ! "));
    }

    @GetMapping("/my-reports")
//@PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getUserReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        try {
            UserReportListResponseDTO response = plantService.getUserReports(userId, page, size, status);
            return ResponseEntity.ok(new ResponseData<>(
                    HttpStatus.OK.value(),
                    "Get user reports successfully",
                    response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage()));
        }
    }

    @GetMapping("/my-reports/{reportId}")
//@PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> getUserReportDetail(
            @PathVariable Long reportId,
            @RequestAttribute("userId") Long userId) {
        try {
            UserReportResponseDTO response = plantService.getUserReportDetail(reportId, userId);
            return ResponseEntity.ok(new ResponseData<>(
                    HttpStatus.OK.value(),
                    "Get report detail successfully",
                    response));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseError(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal server error"));
        }
    }
}
