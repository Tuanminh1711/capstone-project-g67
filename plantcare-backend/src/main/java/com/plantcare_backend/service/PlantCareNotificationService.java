package com.plantcare_backend.service;

import org.springframework.stereotype.Service;

@Service
public interface PlantCareNotificationService {
    void sendWateringReminder(Long userPlantId);
    void sendFertilizingReminder(Long userPlantId);
    void sendCustomCareReminder(Long userPlantId, String careType);
    void sendDailyReminders();
    void markCareAsCompleted(Long scheduleId, String notes, String imageUrl);
}
