package com.plantcare_backend.service.impl;

import com.plantcare_backend.model.Notification;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.NotificationRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    @Autowired
    private final NotificationRepository notificationRepository;
    @Autowired
    private final UserRepository userRepository;

    @Override
    public Notification createNotification(Long userId, String title, String message,
                                           Notification.NotificationType type, String link) {
        log.info("Creating notification for user: {}, title: {}", userId, title);

        Users user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .status(Notification.NotificationStatus.UNREAD)
                .link(link)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification created successfully with id: {}", savedNotification.getId());

        return savedNotification;
    }

    @Override
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        log.info("Getting notifications for user: {}", userId);
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public List<Notification> getUnreadNotifications(Long userId) {
        log.info("Getting unread notifications for user: {}", userId);
        return notificationRepository.findByUser_IdAndStatusOrderByCreatedAtDesc(
                userId, Notification.NotificationStatus.UNREAD);
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        log.info("Marking notification {} as read for user: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        // Kiểm tra notification có thuộc về user không
        if (notification.getUser().getId() != userId) {
            throw new RuntimeException("Notification does not belong to user");
        }

        notification.setStatus(Notification.NotificationStatus.READ);
        notificationRepository.save(notification);
        log.info("Notification marked as read successfully");
    }

    @Override
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user: {}", userId);

        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        unreadNotifications.forEach(notification ->
                notification.setStatus(Notification.NotificationStatus.READ));

        notificationRepository.saveAll(unreadNotifications);
        log.info("All notifications marked as read successfully");
    }

    @Override
    public Long getUnreadCount(Long userId) {
        log.info("Getting unread count for user: {}", userId);
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Override
    public void deleteNotification(Long notificationId, Long userId) {
        log.info("Deleting notification {} for user: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        // Kiểm tra notification có thuộc về user không
        if (notification.getUser().getId() != userId) {
            throw new RuntimeException("Notification does not belong to user");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted successfully");
    }
}
