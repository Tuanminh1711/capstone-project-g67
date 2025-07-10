package com.plantcare_backend.dto.response.plantcare;

import lombok.Data;

import java.time.LocalTime;
import java.util.Date;

@Data
public class CareScheduleResponseDTO {
    private Long scheduleId;
    private Long careTypeId;
    private String careTypeName;
    private Boolean enabled;
    private Integer frequencyDays;
    private LocalTime reminderTime;
    private String customMessage;
    private Date startDate;
    private Date lastCareDate;
    private Date nextCareDate;
}
