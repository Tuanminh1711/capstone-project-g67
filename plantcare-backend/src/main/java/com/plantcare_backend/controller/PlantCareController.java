package com.plantcare_backend.controller;

import com.plantcare_backend.dto.request.plantcare.CareScheduleSetupRequest;
import com.plantcare_backend.dto.response.plantcare.CareScheduleResponseDTO;
import com.plantcare_backend.service.CareScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plant-care")
public class PlantCareController {
    @Autowired
    private CareScheduleService careScheduleService;

    // Setup nhắc nhở cho từng loại công việc chăm sóc trên 1 cây
    @PostMapping("/{userPlantId}/care-reminders")
    public ResponseEntity<?> setupCareReminders(
            @PathVariable Long userPlantId,
            @RequestBody CareScheduleSetupRequest request) {
        careScheduleService.setupCareSchedules(userPlantId, request.getSchedules());
        return ResponseEntity.ok("Cập nhật nhắc nhở thành công!");
    }

    //lấy danh sách nhắc nhở đã setup
    @GetMapping("/{userPlantId}/care-reminders")
    public ResponseEntity<List<CareScheduleResponseDTO>> getCareReminders(@PathVariable Long userPlantId) {
        List<CareScheduleResponseDTO> schedules = careScheduleService.getCareSchedules(userPlantId);
        return ResponseEntity.ok(schedules);
    }


}
