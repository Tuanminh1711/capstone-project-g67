package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.plantcare.CareScheduleSetupRequestDTO;
import com.plantcare_backend.dto.response.plantcare.CareScheduleResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.CareType;
import com.plantcare_backend.model.Notification;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.CareTypeRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.CareScheduleService;
import com.plantcare_backend.service.NotificationService;
import com.plantcare_backend.service.PlantCareNotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalTime;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareScheduleServiceImpl implements CareScheduleService {
    private final CareScheduleRepository careScheduleRepository;
    private final CareTypeRepository careTypeRepository;
    private final UserPlantRepository userPlantRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PlantCareNotificationService plantCareNotificationService;

    @Override
    @Transactional
    public void setupCareSchedules(Long userPlantId, List<CareScheduleSetupRequestDTO> schedules) {
        UserPlants userPlant = userPlantRepository.findById(userPlantId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found"));

        for (CareScheduleSetupRequestDTO dto : schedules) {
            CareType careType = careTypeRepository.findById(dto.getCareTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Care type not found"));

            Optional<CareSchedule> existing = careScheduleRepository
                    .findByUserPlant_UserPlantIdAndCareType_CareTypeId(userPlantId, dto.getCareTypeId());

            if (existing.isPresent()) {
                // Cập nhật schedule đã tồn tại
                CareSchedule schedule = existing.get();
                schedule.setReminderEnabled(dto.getEnabled());
                schedule.setFrequencyDays(dto.getFrequencyDays());
                schedule.setReminderTime(dto.getReminderTime());
                schedule.setCustomMessage(dto.getCustomMessage());
                schedule.setStartDate(dto.getStartDate());

                // Tính toán next_care_date
                if (dto.getStartDate() != null) {
                    schedule.setNextCareDate(calculateNextCareDate(dto.getStartDate(), dto.getFrequencyDays()));
                }

                careScheduleRepository.save(schedule);

                try {
                    notificationService.createNotification(
                            userPlant.getUserId(),
                            "Lịch chăm sóc cây đã được cập nhật",
                            "Lịch " + careType.getCareTypeName() + " cho cây " + userPlant.getPlantName() + " đã được thiết lập.",
                            Notification.NotificationType.INFO,
                            "/user-plants/" + userPlantId
                    );
                } catch (Exception e) {
                    log.warn("Failed to create notification for care schedule setup: {}", e.getMessage());
                }

                // Kiểm tra và gửi reminder ngay nếu schedule đã đến hạn
                checkAndSendImmediateReminder(schedule);

            } else {
                // Tạo schedule mới
                CareSchedule schedule = CareSchedule.builder()
                        .userPlant(userPlant)
                        .careType(careType)
                        .reminderEnabled(dto.getEnabled())
                        .frequencyDays(dto.getFrequencyDays())
                        .reminderTime(dto.getReminderTime())
                        .customMessage(dto.getCustomMessage())
                        .startDate(dto.getStartDate())
                        .createdAt(new Timestamp(System.currentTimeMillis()))
                        .build();

                // Tính toán next_care_date cho schedule mới
                if (dto.getStartDate() != null) {
                    schedule.setNextCareDate(calculateNextCareDate(dto.getStartDate(), dto.getFrequencyDays()));
                }

                careScheduleRepository.save(schedule);

                // Kiểm tra và gửi reminder ngay nếu schedule đã đến hạn
                checkAndSendImmediateReminder(schedule);
            }
        }
    }

    // Hàm calculateNextCareDate đã được sửa
    private Date calculateNextCareDate(Date startDate, Integer frequencyDays) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(startDate);

        // Cộng thêm số ngày
        cal.add(Calendar.DAY_OF_MONTH, frequencyDays);

        // LUÔN set giờ về 00:00:00 để tránh vấn đề so sánh
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        return cal.getTime();
    }

    private void checkAndSendImmediateReminder(CareSchedule schedule) {
        if (Boolean.TRUE.equals(schedule.getReminderEnabled()) &&
                schedule.getNextCareDate() != null &&
                schedule.getReminderTime() != null) {

            Date now = new Date();
            LocalTime currentTime = LocalTime.now();

            // Kiểm tra xem schedule có đến hạn ngay bây giờ không
            if (schedule.getNextCareDate().before(now) || schedule.getNextCareDate().equals(now)) {
                // Kiểm tra thời gian reminder có phù hợp không (trong khoảng ±30 phút)
                LocalTime reminderTime = schedule.getReminderTime();
                LocalTime timeWindowStart = reminderTime.minusMinutes(5);
                LocalTime timeWindowEnd = reminderTime.plusMinutes(1);

                if (currentTime.isAfter(timeWindowStart) && currentTime.isBefore(timeWindowEnd)) {
                    try {
                        plantCareNotificationService.sendReminder(schedule); // Sử dụng tên đã đổi

                        // Thêm notification cho user
                        notificationService.createNotification(
                                schedule.getUserPlant().getUserId(),
                                "Nhắc nhở chăm sóc cây",
                                "Cây " + schedule.getUserPlant().getPlantName() + " cần được " +
                                        schedule.getCareType().getCareTypeName() + " hôm nay.",
                                Notification.NotificationType.WARNING,
                                "/user-plants/" + schedule.getUserPlant().getUserPlantId()
                        );
                    } catch (Exception e) {
                        // Log lỗi nhưng không throw exception để không ảnh hưởng đến việc tạo schedule
                        System.err.println("Failed to send immediate reminder for schedule: " + schedule.getScheduleId()
                                + ", Error: " + e.getMessage());
                    }
                }
            }
        }
    }

    @Override
    public List<CareScheduleResponseDTO> getCareSchedules(Long userPlantId) {
        List<CareSchedule> schedules = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId);
        return schedules.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private CareScheduleResponseDTO toDTO(CareSchedule schedule) {
        CareScheduleResponseDTO dto = new CareScheduleResponseDTO();
        dto.setScheduleId(schedule.getScheduleId());
        dto.setCareTypeId(schedule.getCareType().getCareTypeId());
        dto.setCareTypeName(schedule.getCareType().getCareTypeName());
        dto.setEnabled(schedule.getReminderEnabled());
        dto.setFrequencyDays(schedule.getFrequencyDays());
        dto.setReminderTime(schedule.getReminderTime());
        dto.setCustomMessage(schedule.getCustomMessage());
        dto.setStartDate(schedule.getStartDate());
        dto.setLastCareDate(schedule.getLastCareDate());
        dto.setNextCareDate(schedule.getNextCareDate());
        return dto;
    }
}
