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
    private UserPlantRepository userPlantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Override
    @Async
    public void sendWateringReminder(Long userPlantId) {
        CareSchedule schedule = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId)
                .stream()
                .filter(s -> "WATERING".equals(s.getCareType().getCareTypeName()))
                .findFirst()
                .orElse(null);

        Date today = new Date();
        if (schedule != null && schedule.getNextCareDate() != null &&
                schedule.getNextCareDate().compareTo(today) <= 0) {  // ← Sửa cách so sánh
            UserPlants userPlant = schedule.getUserPlant();
            Users user = userRepository.findById(userPlant.getUserId().intValue()).orElse(null);

            if (user != null && userPlant.isReminder_enabled()) {
                String subject = "🌱 Nhắc nhở tưới cây";
                String content = String.format(
                        "Chào %s,\n\n" +
                                "Đã đến lúc tưới nước cho cây \"%s\" của bạn!\n" +
                                "Vị trí: %s\n\n" +
                                "PlantCare Team",
                        user.getUsername(),
                        userPlant.getPlantName(),
                        userPlant.getPlantLocation()
                );

                emailService.sendEmailAsync(user.getEmail(), subject, content);
                log.info("Sent watering reminder to user: {}", user.getEmail());
            }
        }
    }

    @Override
    @Async
    public void sendFertilizingReminder(Long userPlantId) {
    }

    @Override
    public void sendCustomCareReminder(Long userPlantId, String careType) {

    }

    @Override
    @Async
    public void sendDailyReminders() {
        Date today = new Date();
        List<CareSchedule> upcomingSchedules = careScheduleRepository.findUpcomingCareSchedules(today);

        for (CareSchedule schedule : upcomingSchedules) {
            String careType = schedule.getCareType().getCareTypeName();
            switch (careType) {
                case "WATERING":
                    sendWateringReminder(schedule.getUserPlant().getUserPlantId());
                    break;
                case "FERTILIZING":
                    sendFertilizingReminder(schedule.getUserPlant().getUserPlantId());
                    break;
            }
        }
    }

    @Override
    @Transactional
    public void markCareAsCompleted(Long scheduleId, String notes, String imageUrl) {
        CareSchedule schedule = careScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Care schedule not found"));

        CareLog careLog = new CareLog();
        careLog.setUserPlant(schedule.getUserPlant());
        careLog.setCareType(schedule.getCareType());
        careLog.setNotes(notes);
        careLog.setImageUrl(imageUrl);
        careLog.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        careLogRepository.save(careLog);

        schedule.setLastCareDate(new Date());
        schedule.setNextCareDate(calculateNextCareDate(schedule.getLastCareDate(), schedule.getFrequencyDays()));
        careScheduleRepository.save(schedule);

        log.info("Marked care as completed for schedule: {}", scheduleId);
    }

    private Date calculateNextCareDate(Date lastCareDate, Integer frequencyDays) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(lastCareDate);
        cal.add(Calendar.DAY_OF_MONTH, frequencyDays);
        return cal.getTime();
    }
}
