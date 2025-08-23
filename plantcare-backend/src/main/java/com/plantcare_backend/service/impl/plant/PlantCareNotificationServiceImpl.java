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

        String confirmLink = "\n\n<b><a href='" + confirmUrl + "'>Tôi đã thực hiện " + careType + "</a></b>";
        String content = (schedule.getCustomMessage() != null && !schedule.getCustomMessage().isEmpty())
                ? schedule.getCustomMessage() + confirmLink
                : String.format(
                "Chào %s,\n\nĐã đến lúc %s cho cây \"%s\" của bạn!\nVị trí: %s\n\nPlantCare Team%s",
                user.getUsername(),
                careType.toLowerCase(),
                schedule.getUserPlant().getPlantName(),
                schedule.getUserPlant().getPlantLocation(),
                confirmLink);

        emailService.sendEmailAsync(user.getEmail(), subject, content);
        log.info("Sent {} reminder to user: {}", careType, user.getEmail());
    }
}
