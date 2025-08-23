package com.plantcare_backend.service.impl.plant;

import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.PlantCareNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;

@Service
@Slf4j
public class PlantCareNotificationServiceImpl implements PlantCareNotificationService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;

    @Value("${plantcare.base-url:https://plantcare.id.vn}")
    private String baseUrl;

    @Override
    public void sendReminder(CareSchedule schedule) {
        log.debug("Processing reminder for schedule: {}", schedule.getScheduleId());

        Users user = schedule.getUserPlant().getUserId() != null
                ? userRepository.findById(schedule.getUserPlant().getUserId().intValue()).orElse(null)
                : null;

        if (user == null || !Boolean.TRUE.equals(schedule.getReminderEnabled())) {
            log.debug("Skipping reminder - user: {}, enabled: {}",
                    user != null ? user.getEmail() : "null",
                    schedule.getReminderEnabled());
            return;
        }

        String careType = schedule.getCareType().getCareTypeName();
        String subject = "🌱 Nhắc nhở chăm sóc cây: " + careType;
        String confirmUrl = baseUrl + "/user/plant/care-confirm?userPlantId=" +
                schedule.getUserPlant().getUserPlantId() + "&careTypeId=" +
                schedule.getCareType().getCareTypeId();

        // Nút button
        String confirmButton = "<div style='margin-top:20px;text-align:center;'>" +
                "<a href='" + confirmUrl + "' style='" +
                "display:inline-block;padding:12px 24px;" +
                "font-size:16px;color:#ffffff;" +
                "background-color:#28a745;text-decoration:none;" +
                "border-radius:6px;font-weight:bold;'>" +
                "✅ Tôi đã thực hiện " + careType +
                "</a></div>";

        // Nội dung email (HTML)
        String content = "<!DOCTYPE html>" +
                "<html lang='vi'>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f9f9f9;padding:20px;'>" +
                "<div style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:20px;" +
                "box-shadow:0 2px 6px rgba(0,0,0,0.1);'>" +
                "<h2 style='color:#2c7a7b;'>🌱 Nhắc nhở chăm sóc cây</h2>" +
                "<p>Chào <b>" + user.getUsername() + "</b>,</p>" +
                (schedule.getCustomMessage() != null && !schedule.getCustomMessage().isEmpty()
                        ? "<p>" + schedule.getCustomMessage() + "</p>"
                        : "<p>Đã đến lúc <b>" + careType.toLowerCase() + "</b> cho cây <b>\"" +
                        schedule.getUserPlant().getPlantName() + "\"</b> của bạn!</p>" +
                        "<p>📍 Vị trí: " + schedule.getUserPlant().getPlantLocation() + "</p>") +
                confirmButton +
                "<hr style='margin:30px 0;border:none;border-top:1px solid #ddd;'/>" +
                "<p style='font-size:12px;color:#888;text-align:center;'>Email này được gửi tự động từ PlantCare.<br>" +
                "Vui lòng không trả lời lại email này.</p>" +
                "</div></body></html>";

        emailService.sendEmailAsync(user.getEmail(), subject, content);
        log.info("Sent {} reminder to user: {}", careType, user.getEmail());
    }

}
