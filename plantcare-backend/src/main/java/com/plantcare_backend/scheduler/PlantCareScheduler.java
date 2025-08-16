package com.plantcare_backend.scheduler;

import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.service.PlantCareNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class PlantCareScheduler {
    @Autowired
    private PlantCareNotificationService notificationService;
    @Autowired
    private CareScheduleRepository careScheduleRepository;

    // Chạy mỗi giờ để kiểm tra reminders
    @Scheduled(cron = "0 * * * * ?")
    public void sendReminders() {
        try {
            LocalTime now = LocalTime.now().withSecond(0).withNano(0);
            Date today = new Date();
            List<CareSchedule> dueSchedules = careScheduleRepository.findDueReminders(today, now);

            log.info("Found {} due schedules at {}", dueSchedules.size(), now);

            for (CareSchedule schedule : dueSchedules) {
                try {
                    notificationService.sendReminder(schedule);
                    log.info("Sent reminder for schedule: {}", schedule.getScheduleId());
                } catch (Exception e) {
                    log.error("Failed to send reminder for schedule: {}", schedule.getScheduleId(), e);
                }
            }

            log.info("Completed processing {} reminders", dueSchedules.size());
        } catch (Exception e) {
            log.error("Critical error in reminder scheduler", e);
        }
    }
}
