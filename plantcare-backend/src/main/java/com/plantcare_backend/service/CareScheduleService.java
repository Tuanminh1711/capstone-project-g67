package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.plantcare.CareScheduleSetupRequest;
import com.plantcare_backend.dto.request.plantcare.CareScheduleSetupRequestDTO;
import com.plantcare_backend.dto.response.plantcare.CareScheduleResponseDTO;

import java.util.List;

public interface CareScheduleService {
    void setupCareSchedules(Long userPlantId, List<CareScheduleSetupRequestDTO> schedules);
    List<CareScheduleResponseDTO> getCareSchedules(Long userPlantId);
}
