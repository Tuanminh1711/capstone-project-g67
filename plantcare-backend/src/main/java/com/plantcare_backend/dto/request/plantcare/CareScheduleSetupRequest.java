package com.plantcare_backend.dto.request.plantcare;

import lombok.Data;

import java.util.List;

@Data
public class CareScheduleSetupRequest {
    private List<CareScheduleSetupRequestDTO> schedules;
}
