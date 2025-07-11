package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.plantcare.CareCompletionRequest;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
public interface CareLogService {
    void logCareActivity(Long userPlantId, CareCompletionRequest request);

    Page<?> getCareHistory(Long userPlantId, int page, int size);

    void logCareActivity(Long userPlantId, Long careTypeId, String notes, String imageUrl);
}