package com.plantcare_backend.controller;

import com.plantcare_backend.dto.request.plantcare.CareCompletionRequest;
import com.plantcare_backend.dto.response.ResponseData;
import com.plantcare_backend.dto.response.ResponseError;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.service.PlantCareNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plant-care")
public class PlantCareController {
    @Autowired
    private PlantCareNotificationService notificationService;

    @Autowired
    private CareScheduleRepository careScheduleRepository;

    @PostMapping("/complete/{scheduleId}")
    public ResponseData<?> markCareAsCompleted(
            @PathVariable Long scheduleId,
            @RequestBody CareCompletionRequest request) {
        try {
            notificationService.markCareAsCompleted(scheduleId, request.getNotes(), request.getImageUrl());
            return new ResponseData<>(HttpStatus.OK.value(), "Care marked as completed successfully", null);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
        }
    }

    @GetMapping("/schedules/{userPlantId}")
    public ResponseData<?> getCareSchedules(@PathVariable Long userPlantId) {
        List<CareSchedule> schedules = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId);
        return new ResponseData<>(HttpStatus.OK.value(), "Care schedules retrieved successfully", schedules);
    }

    @PostMapping("/test-reminder/{userPlantId}")
    public ResponseData<?> sendTestReminder(@PathVariable Long userPlantId) {
        notificationService.sendWateringReminder(userPlantId);
        return new ResponseData<>(HttpStatus.OK.value(), "Test reminder sent successfully", null);
    }
}
