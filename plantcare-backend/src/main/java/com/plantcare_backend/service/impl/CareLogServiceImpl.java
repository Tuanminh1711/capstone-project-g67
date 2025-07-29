package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.plantcare.CareCompletionRequest;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.CareLog;
import com.plantcare_backend.model.CareSchedule;
import com.plantcare_backend.model.CareType;
import com.plantcare_backend.model.UserPlants;
import com.plantcare_backend.repository.CareLogRepository;
import com.plantcare_backend.repository.CareScheduleRepository;
import com.plantcare_backend.repository.CareTypeRepository;
import com.plantcare_backend.repository.UserPlantRepository;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.CareLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Calendar;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareLogServiceImpl implements CareLogService {

    private final CareLogRepository careLogRepository;
    private final UserPlantRepository userPlantRepository;
    private final CareScheduleRepository careScheduleRepository;
    private final CareTypeRepository careTypeRepository;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public void logCareActivity(Long userPlantId, CareCompletionRequest request) {
        // Kiểm tra userPlant có tồn tại không
        UserPlants userPlant = userPlantRepository.findById(userPlantId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found with id: " + userPlantId));

        // Tạo care log mới
        CareLog careLog = CareLog.builder()
                .userPlant(userPlant)
                .notes(request.getNotes())
                .imageUrl(request.getImageUrl())
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build();

        careLogRepository.save(careLog);

        // Cập nhật lastCareDate cho tất cả care schedules của cây này
        updateCareSchedulesLastCareDate(userPlantId);

        log.info("Logged care activity for user plant: {}", userPlantId);
    }

    @Override
    @Transactional
    public void logCareActivity(Long userPlantId, Long careTypeId, String notes, String imageUrl) {
        UserPlants userPlant = userPlantRepository.findById(userPlantId)
                .orElseThrow(() -> new ResourceNotFoundException("User plant not found with id: " + userPlantId));

        // Lấy userId từ userPlant
        Long userId = userPlant.getUserId();

        CareType careType = null;
        if (careTypeId != null) {
            careType = careTypeRepository.findById(careTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Care type not found with id: " + careTypeId));
        }

        CareLog careLog = CareLog.builder()
                .userPlant(userPlant)
                .careType(careType)
                .notes(notes)
                .imageUrl(imageUrl)
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build();
        careLogRepository.save(careLog);
        updateCareSchedulesLastCareDate(userPlantId);

        // Ghi activity log
        if (userId != null) {
            try {
                activityLogService.logActivity(userId.intValue(), "CONFIRM_CARE_FROM_EMAIL",
                        "Confirmed care activity from email for user plant: " + userPlantId +
                                " - Care type: " + (careType != null ? careType.getCareTypeName() : "Unknown"));
            } catch (Exception e) {
                log.error("Failed to log activity for user: {}", userId, e);
            }
        }

        log.info("Logged care activity (confirm) for user plant: {}", userPlantId);
    }

    @Override
    public Page<?> getCareHistory(Long userPlantId, int page, int size) {
        // Kiểm tra userPlant có tồn tại không
        if (!userPlantRepository.existsById(userPlantId)) {
            throw new ResourceNotFoundException("User plant not found with id: " + userPlantId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CareLog> careLogs = careLogRepository.findByUserPlant_UserPlantId(userPlantId, pageable);

        return careLogs.map(this::toCareLogResponse);
    }

    private void updateCareSchedulesLastCareDate(Long userPlantId) {
        Date now = new Date();
        careScheduleRepository.updateLastCareDateByUserPlantId(userPlantId, now);

        // Cập nhật next_care_date cho tất cả schedules của cây này
        List<CareSchedule> schedules = careScheduleRepository.findByUserPlant_UserPlantId(userPlantId);
        for (CareSchedule schedule : schedules) {
            if (schedule.getFrequencyDays() != null && schedule.getLastCareDate() != null) {
                Date nextCareDate = calculateNextCareDate(schedule.getLastCareDate(), schedule.getFrequencyDays());
                schedule.setNextCareDate(nextCareDate);
                careScheduleRepository.save(schedule);
            }
        }
    }

    private Date calculateNextCareDate(Date lastCareDate, Integer frequencyDays) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(lastCareDate);
        cal.add(Calendar.DAY_OF_MONTH, frequencyDays);
        return cal.getTime();
    }

    private CareLogResponse toCareLogResponse(CareLog careLog) {
        return CareLogResponse.builder()
                .logId(careLog.getLogId())
                .careDate(careLog.getCreatedAt())
                .notes(careLog.getNotes())
                .imageUrl(careLog.getImageUrl())
                .createdAt(careLog.getCreatedAt())
                .build();
    }

    // Inner class cho response
    public static class CareLogResponse {
        private Long logId;
        private Date careDate;
        private String notes;
        private String imageUrl;
        private Date createdAt;

        // Builder pattern
        public static CareLogResponseBuilder builder() {
            return new CareLogResponseBuilder();
        }

        public static class CareLogResponseBuilder {
            private CareLogResponse response = new CareLogResponse();

            public CareLogResponseBuilder logId(Long logId) {
                response.logId = logId;
                return this;
            }

            public CareLogResponseBuilder careDate(Date careDate) {
                response.careDate = careDate;
                return this;
            }

            public CareLogResponseBuilder notes(String notes) {
                response.notes = notes;
                return this;
            }

            public CareLogResponseBuilder imageUrl(String imageUrl) {
                response.imageUrl = imageUrl;
                return this;
            }

            public CareLogResponseBuilder createdAt(Date createdAt) {
                response.createdAt = createdAt;
                return this;
            }

            public CareLogResponse build() {
                return response;
            }
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public Date getCreatedAt() {
            return createdAt;
        }
    }
}