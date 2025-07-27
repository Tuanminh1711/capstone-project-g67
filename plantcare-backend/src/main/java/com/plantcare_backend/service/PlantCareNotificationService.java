package com.plantcare_backend.service;

import com.plantcare_backend.model.CareSchedule;
import org.springframework.stereotype.Service;

@Service
public interface PlantCareNotificationService {
    void sendReminder(CareSchedule schedule);
}
