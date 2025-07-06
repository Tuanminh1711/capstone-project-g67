package com.plantcare_backend.scheduler;

import com.plantcare_backend.service.PlantCareNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PlantCareScheduler {
    @Autowired
    private PlantCareNotificationService notificationService;

    // Chạy mỗi ngày lúc 8:00 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendDailyReminders() {
        log.info("Starting daily plant care reminders...");
        notificationService.sendDailyReminders();
    }

    // Chạy mỗi giờ để kiểm tra reminder cần gửi
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void checkHourlyReminders() {
        log.info("Checking for hourly reminders...");
        // Logic kiểm tra reminder theo giờ
    }
}
