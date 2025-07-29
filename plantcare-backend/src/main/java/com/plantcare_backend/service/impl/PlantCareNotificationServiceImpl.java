package com.plantcare_backend.service.impl;

import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.CareLog;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.EmailService;
import com.plantcare_backend.service.PlantCareNotificationService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class PlantCareNotificationServiceImpl implements PlantCareNotificationService {
    @Autowired
    private CareScheduleRepository careScheduleRepository;
    @Autowired
    private CareLogRepository careLogRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;

    @Value("${plantcare.base-url:http://localhost:4200}")
    private String baseUrl;

    private Date calculateNextCareDate(Date lastCareDate, Integer frequencyDays) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(lastCareDate);
        cal.add(Calendar.DAY_OF_MONTH, frequencyDays);
        return cal.getTime();
    }

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
        String confirmUrl = baseUrl + "/api/plant-care/" +
                schedule.getUserPlant().getUserPlantId() +
                "/care-reminders/" + schedule.getCareType().getCareTypeId() + "/confirm";
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
