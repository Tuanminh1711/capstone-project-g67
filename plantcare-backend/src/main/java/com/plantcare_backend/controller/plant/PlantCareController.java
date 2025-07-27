package com.plantcare_backend.controller.plant;

import com.plantcare_backend.dto.request.plantcare.CareCompletionRequest;
import com.plantcare_backend.dto.request.plantcare.CareScheduleSetupRequest;
import com.plantcare_backend.dto.response.plantcare.CareScheduleResponseDTO;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.service.CareScheduleService;
import com.plantcare_backend.service.CareLogService;
import com.plantcare_backend.service.PlantCareNotificationService;
import com.plantcare_backend.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/plant-care")
public class PlantCareController {
    @Autowired
    private CareScheduleService careScheduleService;

    @Autowired
    private CareLogService careLogService;

    @Autowired
    private ActivityLogService activityLogService;

    // Setup nhắc nhở cho từng loại công việc chăm sóc trên 1 cây
    @PostMapping("/{userPlantId}/care-reminders")
    public ResponseEntity<?> setupCareReminders(
            @PathVariable Long userPlantId,
            @RequestBody CareScheduleSetupRequest request,
            HttpServletRequest httpRequest) {
        careScheduleService.setupCareSchedules(userPlantId, request.getSchedules());

        // Log the activity (assuming we can get userId from request)
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId != null) {
            activityLogService.logActivity(userId.intValue(), "SETUP_CARE_REMINDERS",
                    "Setup care reminders for user plant: " + userPlantId, httpRequest);
        }

        return ResponseEntity.ok("Cập nhật nhắc nhở thành công!");
    }

    // lấy danh sách nhắc nhở đã setup
    @GetMapping("/{userPlantId}/care-reminders")
    public ResponseEntity<List<CareScheduleResponseDTO>> getCareReminders(@PathVariable Long userPlantId) {
        List<CareScheduleResponseDTO> schedules = careScheduleService.getCareSchedules(userPlantId);
        return ResponseEntity.ok(schedules);
    }

    // Ghi nhật ký chăm sóc cây
    @PostMapping("/{userPlantId}/care-log")
    public ResponseEntity<?> logCareActivity(
            @PathVariable Long userPlantId,
            @RequestBody CareCompletionRequest request,
            HttpServletRequest httpRequest) {
        careLogService.logCareActivity(userPlantId, request);

        // Log the activity (assuming we can get userId from request)
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId != null) {
            activityLogService.logActivity(userId.intValue(), "CARE_PLANT",
                    "Logged care activity for user plant: " + userPlantId, httpRequest);
        }

        return ResponseEntity.ok("Đã ghi nhật ký chăm sóc thành công!");
    }

    // Lấy lịch sử chăm sóc của một cây
    @GetMapping("/{userPlantId}/care-history")
    public ResponseEntity<?> getCareHistory(
            @PathVariable Long userPlantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(careLogService.getCareHistory(userPlantId, page, size));
    }

    // Xác nhận đã thực hiện chăm sóc từ email nhắc nhở
    @PostMapping("/{userPlantId}/care-reminders/{careTypeId}/confirm")
    public ResponseEntity<?> confirmCare(
            @PathVariable Long userPlantId,
            @PathVariable Long careTypeId) {
        careLogService.logCareActivity(userPlantId, careTypeId, "Xác nhận từ email nhắc nhở", null);
        return ResponseEntity.ok("Đã ghi nhận bạn đã chăm sóc cây!");
    }

    @Autowired
    private PlantCareNotificationService notificationService;
    @Autowired
    private CareScheduleRepository careScheduleRepository;

    // API test gửi nhắc nhở ngay lập tức
    @PostMapping("/test-send-reminder/{careScheduleId}")
    public ResponseEntity<?> testSendReminder(@PathVariable Long careScheduleId) {
        CareSchedule schedule = careScheduleRepository.findById(careScheduleId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        notificationService.sendReminder(schedule);
        return ResponseEntity.ok("Đã gửi mail test!");
    }
}
