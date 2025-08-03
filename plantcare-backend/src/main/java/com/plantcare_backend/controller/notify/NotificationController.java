package com.plantcare_backend.controller.notify;

import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.model.Notification;
import com.plantcare_backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notification Controller", description = "APIs for user notifications")
@CrossOrigin(origins = "http://localhost:4200/")
public class NotificationController {
    private final NotificationService notificationService;

    /**
     * Lấy danh sách notification của user (có phân trang)
     */
    @Operation(summary = "Get user notifications", description = "Get paginated list of user notifications")
    @GetMapping
    public ResponseData<Page<Notification>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> notifications = notificationService.getUserNotifications(userId, pageable);

            log.info("Retrieved {} notifications for user: {}", notifications.getTotalElements(), userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get notifications successfully", notifications);

        } catch (Exception e) {
            log.error("Error getting notifications", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to get notifications: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách notification chưa đọc
     */
    @Operation(summary = "Get unread notifications", description = "Get list of unread notifications")
    @GetMapping("/unread")
    public ResponseData<List<Notification>> getUnreadNotifications(HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            List<Notification> unreadNotifications = notificationService.getUnreadNotifications(userId);

            log.info("Retrieved {} unread notifications for user: {}", unreadNotifications.size(), userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get unread notifications successfully", unreadNotifications);

        } catch (Exception e) {
            log.error("Error getting unread notifications", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to get unread notifications: " + e.getMessage());
        }
    }

    /**
     * Đánh dấu notification đã đọc
     */
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read")
    @PostMapping("/{notificationId}/mark-read")
    public ResponseData<?> markAsRead(@PathVariable Long notificationId, HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            notificationService.markAsRead(notificationId, userId);

            log.info("Marked notification {} as read for user: {}", notificationId, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Notification marked as read successfully");

        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to mark notification as read: " + e.getMessage());
        }
    }

    /**
     * Đánh dấu tất cả notification đã đọc
     */
    @Operation(summary = "Mark all notifications as read", description = "Mark all user notifications as read")
    @PostMapping("/mark-all-read")
    public ResponseData<?> markAllAsRead(HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            notificationService.markAllAsRead(userId);

            log.info("Marked all notifications as read for user: {}", userId);
            return new ResponseData<>(HttpStatus.OK.value(), "All notifications marked as read successfully");

        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to mark all notifications as read: " + e.getMessage());
        }
    }

    /**
     * Đếm số notification chưa đọc
     */
    @Operation(summary = "Get unread count", description = "Get count of unread notifications")
    @GetMapping("/unread-count")
    public ResponseData<Long> getUnreadCount(HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            Long unreadCount = notificationService.getUnreadCount(userId);

            log.info("Retrieved unread count: {} for user: {}", unreadCount, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get unread count successfully", unreadCount);

        } catch (Exception e) {
            log.error("Error getting unread count", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to get unread count: " + e.getMessage());
        }
    }

    /**
     * Xóa notification
     */
    @Operation(summary = "Delete notification", description = "Delete a specific notification")
    @DeleteMapping("/{notificationId}")
    public ResponseData<?> deleteNotification(@PathVariable Long notificationId, HttpServletRequest request) {

        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return new ResponseError(HttpStatus.UNAUTHORIZED.value(), "User not authenticated");
            }

            notificationService.deleteNotification(notificationId, userId);

            log.info("Deleted notification {} for user: {}", notificationId, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Notification deleted successfully");

        } catch (Exception e) {
            log.error("Error deleting notification", e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to delete notification: " + e.getMessage());
        }
    }
}
