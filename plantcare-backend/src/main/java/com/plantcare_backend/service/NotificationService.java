package com.plantcare_backend.service;

import com.plantcare_backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    /**
     * Tạo notification mới
     */
    Notification createNotification(Long userId, String title, String message,
                                    Notification.NotificationType type, String link);

    /**
     * Lấy danh sách notification của user (có phân trang)
     */
    Page<Notification> getUserNotifications(Long userId, Pageable pageable);

    /**
     * Lấy danh sách notification chưa đọc của user
     */
    List<Notification> getUnreadNotifications(Long userId);

    /**
     * Đánh dấu notification đã đọc
     */
    void markAsRead(Long notificationId, Long userId);

    /**
     * Đánh dấu tất cả notification của user đã đọc
     */
    void markAllAsRead(Long userId);

    /**
     * Đếm số notification chưa đọc của user
     */
    Long getUnreadCount(Long userId);

    /**
     * Xóa notification
     */
    void deleteNotification(Long notificationId, Long userId);
}
