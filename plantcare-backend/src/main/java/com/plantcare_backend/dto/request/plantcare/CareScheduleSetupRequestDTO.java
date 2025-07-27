package com.plantcare_backend.dto.request.plantcare;

import lombok.Data;

import java.time.LocalTime;
import java.util.Date;

@Data
public class CareScheduleSetupRequestDTO {
    private Long careTypeId;         // ID loại công việc chăm sóc (watering, fertilizing, ...)
    private Boolean enabled;         // Bật/tắt nhắc nhở cho loại này
    private Integer frequencyDays;   // Tần suất lặp lại (số ngày)
    private LocalTime reminderTime;  // Giờ nhắc nhở (ví dụ: 08:00)
    private String customMessage;    // (Optional) Nội dung nhắc nhở cá nhân hóa
    private Date startDate;          // (Optional) Ngày bắt đầu nhắc nhở
}
