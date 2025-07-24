package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.personal.PersonalActivityLogRequestDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivityLogResponseDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivitySummaryResponseDTO;
import com.plantcare_backend.model.UserActivityLog;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.service.PersonalActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of PersonalActivityService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalActivityServiceImpl implements PersonalActivityService {

    @Autowired
    private final UserActivityLogRepository userActivityLogRepository;

    @Override
    public Page<PersonalActivityLogResponseDTO> getPersonalActivityLogs(int userId,
            PersonalActivityLogRequestDTO requestDTO) {
        log.info("Getting personal activity logs for user: {}", userId);

        // Create sort
        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(requestDTO.getSortDirection()) ? Sort.Direction.DESC : Sort.Direction.ASC,
                requestDTO.getSortBy());

        // Create pageable
        Pageable pageable = PageRequest.of(requestDTO.getPageNo(), requestDTO.getPageSize(), sort);

        // Get activity logs with filters
        Page<UserActivityLog> activityLogsPage = userActivityLogRepository.findByUser_IdWithFilters(userId,
                requestDTO.getStartDate(), requestDTO.getEndDate(), requestDTO.getActionType(), pageable);

        // Convert to DTO
        return activityLogsPage.map(this::convertToPersonalActivityLogResponseDTO);
    }

    @Override
    public PersonalActivitySummaryResponseDTO getPersonalActivitySummary(int userId) {
        log.info("Getting personal activity summary for user: {}", userId);

        PersonalActivitySummaryResponseDTO summary = new PersonalActivitySummaryResponseDTO();

        // Get total activities
        long totalActivities = userActivityLogRepository.countByUser_Id(userId);
        summary.setTotalActivities(totalActivities);

        // Get login activities count
        long loginActivities = userActivityLogRepository.countByUser_IdAndAction(userId, "LOGIN");
        summary.setTotalLoginActivities(loginActivities);

        // Get plant-related activities count
        long plantActivities = userActivityLogRepository.countByUser_IdAndAction(userId, "CREATE_PLANT")
                + userActivityLogRepository.countByUser_IdAndAction(userId, "UPDATE_PLANT")
                + userActivityLogRepository.countByUser_IdAndAction(userId, "DELETE_PLANT")
                + userActivityLogRepository.countByUser_IdAndAction(userId, "CARE_PLANT");
        summary.setTotalPlantActivities(plantActivities);

        // Get profile activities count
        long profileActivities = userActivityLogRepository.countByUser_IdAndAction(userId, "UPDATE_PROFILE")
                + userActivityLogRepository.countByUser_IdAndAction(userId, "CHANGE_PASSWORD");
        summary.setTotalProfileActivities(profileActivities);

        // Get action type breakdown
        List<Object[]> actionTypeCounts = userActivityLogRepository.getActionTypeCountsByUser(userId);
        Map<String, Long> actionTypeMap = new HashMap<>();
        for (Object[] row : actionTypeCounts) {
            String action = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            actionTypeMap.put(action, count);
        }
        summary.setActionTypeCounts(actionTypeMap);

        // Get most active day
        List<Object[]> mostActiveDayData = userActivityLogRepository.getMostActiveDayByUser(userId);
        if (!mostActiveDayData.isEmpty()) {
            Object[] row = mostActiveDayData.get(0);
            LocalDate date = (row[0] instanceof java.sql.Date) ? ((java.sql.Date) row[0]).toLocalDate()
                    : (LocalDate) row[0];
            long count = ((Number) row[1]).longValue();
            summary.setMostActiveDay(date.toString());
            summary.setMostActiveDayCount(count);
        }

        return summary;
    }

    /**
     * Convert UserActivityLog to PersonalActivityLogResponseDTO
     */
    private PersonalActivityLogResponseDTO convertToPersonalActivityLogResponseDTO(UserActivityLog activityLog) {
        PersonalActivityLogResponseDTO responseDTO = new PersonalActivityLogResponseDTO();
        responseDTO.setId(activityLog.getId());
        responseDTO.setAction(activityLog.getAction());
        responseDTO.setTimestamp(activityLog.getTimestamp());
        responseDTO.setIpAddress(activityLog.getIpAddress());
        responseDTO.setDescription(activityLog.getDescription());

        // Extract location from description if available
        String description = activityLog.getDescription();
        if (description != null && description.contains("location:")) {
            String location = description.substring(description.indexOf("location:") + 9).trim();
            responseDTO.setLocation(location);
        }

        return responseDTO;
    }
}