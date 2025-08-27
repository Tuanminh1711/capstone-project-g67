package com.plantcare_backend.service.impl.plant;

import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.repository.UserProfileRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.PlantCareNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;
import java.util.Optional;

@Service
@Slf4j
public class PlantCareNotificationServiceImpl implements PlantCareNotificationService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
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

        Optional<UserProfile> userProfileOpt = userProfileRepository.findByUser(user);

        String careType = schedule.getCareType().getCareTypeName();
        String careTypeVietnamese = translateCareTypeToVietnamese(careType);
        String subject = "🌱 Nhắc nhở chăm sóc cây: " + careTypeVietnamese;
        String confirmUrl = baseUrl + "/user/plant/care-confirm?userPlantId=" +
                schedule.getUserPlant().getUserPlantId() + "&careTypeId=" +
                schedule.getCareType().getCareTypeId();

        String confirmButton = "<div style='margin-top:20px;text-align:center;'>" +
                "<a href='" + confirmUrl + "' style='" +
                "display:inline-block;padding:12px 24px;" +
                "font-size:16px;color:#ffffff;" +
                "background-color:#28a745;text-decoration:none;" +
                "border-radius:6px;font-weight:bold;'>" +
                "✅ Tôi đã thực hiện " + careTypeVietnamese +
                "</a></div>";

        String content = "<!DOCTYPE html>" +
                "<html lang='vi'>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f9f9f9;padding:20px;'>" +
                "<div style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:20px;" +
                "box-shadow:0 2px 6px rgba(0,0,0,0.1);'>" +
                "<h2 style='color:#2c7a7b;'>🌱 Nhắc nhở chăm sóc cây</h2>" +
                "<p>Chào <b>" + getUserDisplayName(user, userProfileOpt) + "</b>,</p>" +
                "<p>Đã đến lúc <b>" + careTypeVietnamese.toLowerCase() + "</b> cho cây <b>\"" +
                schedule.getUserPlant().getPlantName() + "\"</b> của bạn!</p>" +
                "<p>📍 Vị trí: " + schedule.getUserPlant().getPlantLocation() + "</p>" +
                (schedule.getCustomMessage() != null && !schedule.getCustomMessage().isEmpty()
                        ? "<p><i>💬 Ghi chú: " + schedule.getCustomMessage() + "</i></p>"
                        : "") +
                confirmButton +
                "<hr style='margin:30px 0;border:none;border-top:1px solid #ddd;'/>" +
                "<p style='font-size:12px;color:#888;text-align:center;'>Email này được gửi tự động từ PlantCare.<br>" +
                "Vui lòng không trả lời lại email này.</p>" +
                "</div></body></html>";

        emailService.sendEmailAsync(user.getEmail(), subject, content);
        log.info("Sent {} reminder to user: {}", careTypeVietnamese, user.getEmail());
    }

    private String getUserDisplayName(Users user, Optional<UserProfile> userProfileOpt) {
        if (userProfileOpt.isPresent() && userProfileOpt.get().getFullName() != null && !userProfileOpt.get().getFullName().trim().isEmpty()) {
            return userProfileOpt.get().getFullName();
        } else {
            return user.getUsername();
        }
    }

    private String translateCareTypeToVietnamese(String englishName) {
        switch (englishName.toLowerCase()) {
            case "watering":
                return "tưới nước";
            case "fertilizing":
                return "bón phân";
            case "pruning":
                return "cắt tỉa";
            case "repotting":
                return "thay chậu";
            case "spraying":
                return "phun thuốc";
            case "cleaning":
                return "lau lá";
            case "weeding":
                return "nhổ cỏ";
            case "mulching":
                return "phủ rơm";
            case "pollination":
                return "thụ phấn";
            case "harvesting":
                return "thu hoạch";
            default:
                return englishName;
        }
    }
}