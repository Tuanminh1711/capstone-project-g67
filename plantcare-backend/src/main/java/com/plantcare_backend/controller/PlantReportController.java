package com.plantcare_backend.controller;

import com.plantcare_backend.dto.request.plantsManager.PlantReportRequestDTO;
import com.plantcare_backend.dto.response.ResponseSuccess;
import com.plantcare_backend.service.PlantService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plants-reprot")
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
}
