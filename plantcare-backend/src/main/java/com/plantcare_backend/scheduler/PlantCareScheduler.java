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

    // Chạy mỗi ngày lúc 8:00 AM
    @Scheduled(cron = "0 * * * * ?")
    public void sendReminders() {
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);
        Date today = new Date();
        List<CareSchedule> dueSchedules = careScheduleRepository.findDueReminders(today, now);

        for (CareSchedule schedule : dueSchedules) {
            notificationService.sendReminder(schedule);
        }
    }
}
