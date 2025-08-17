package com.plantcare_backend.service.impl.admin;

import com.plantcare_backend.model.UserActivityLog;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserActivityLogRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.external_service.IpLocationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Implementation of ActivityLogService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogServiceImpl implements ActivityLogService {

    private final UserActivityLogRepository userActivityLogRepository;
    private final UserRepository userRepository;
    private final IpLocationService ipLocationService;

    @Override
    public void logActivity(int userId, String action, String description, HttpServletRequest request) {
        try {
            String ipAddress = getClientIp(request);
            String location = ipLocationService.getLocationFromIp(ipAddress);

            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            UserActivityLog activityLog = UserActivityLog.builder()
                    .user(user)
                    .action(action)
                    .timestamp(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .description(description + " " + location)
                    .build();

            userActivityLogRepository.save(activityLog);
            log.info("Activity logged: User {} performed {} - {}", userId, action, description);

        } catch (Exception e) {
            log.error("Failed to log activity for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void logActivity(int userId, String action, String description, String ipAddress) {
        try {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            UserActivityLog activityLog = UserActivityLog.builder()
                    .user(user)
                    .action(action)
                    .timestamp(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .description(description)
                    .build();

            userActivityLogRepository.save(activityLog);
            log.info("Activity logged: User {} performed {} - {}", userId, action, description);

        } catch (Exception e) {
            log.error("Failed to log activity for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void logActivity(int userId, String action, String description) {
        try {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            UserActivityLog activityLog = UserActivityLog.builder()
                    .user(user)
                    .action(action)
                    .timestamp(LocalDateTime.now())
                    .description(description)
                    .build();

            userActivityLogRepository.save(activityLog);
            log.info("Activity logged: User {} performed {} - {}", userId, action, description);

        } catch (Exception e) {
            log.error("Failed to log activity for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}