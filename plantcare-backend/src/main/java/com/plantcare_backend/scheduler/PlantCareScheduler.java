package com.plantcare_backend.scheduler;

import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.service.PlantCareNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class PlantCareScheduler {
    @Autowired
    private PlantCareNotificationService plantCareNotificationService;
    @Autowired
    private CareScheduleRepository careScheduleRepository;

    // Chạy mỗi giờ để kiểm tra reminders
    @Scheduled(cron = "0 * * * * ?")
    public void sendCareReminders() {
        Date today = new Date();
        LocalTime now = LocalTime.now();

        List<CareSchedule> dueSchedules = careScheduleRepository.findDueReminders(today, now);

        for (CareSchedule schedule : dueSchedules) {
            try {
                plantCareNotificationService.sendReminder(schedule);

                Date nextCareDate = calculateNextCareDate(schedule.getNextCareDate(), schedule.getFrequencyDays());
                schedule.setNextCareDate(nextCareDate);
                careScheduleRepository.save(schedule);

                log.info("Sent reminder and updated next_care_date for schedule: {}", schedule.getScheduleId());

            } catch (Exception e) {
                log.error("Failed to send reminder for schedule: {}", schedule.getScheduleId(), e);
            }
        }
    }

    private Date calculateNextCareDate(Date currentDate, Integer frequencyDays) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(currentDate);
        cal.add(Calendar.DAY_OF_MONTH, frequencyDays);
        return cal.getTime();
    }
}
