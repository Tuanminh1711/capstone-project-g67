package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.chat.NotificationDTO;
import com.plantcare_backend.model.Notification;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.ChatNotificationService;
import com.plantcare_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatNotificationServiceImpl implements ChatNotificationService {
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void sendChatNotification(Long senderId, Long receiverId, String messageContent) {
        try {
            // Lấy thông tin sender
            Users sender = userRepository.findById(senderId.intValue())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            // Tạo notification
            String title = "Tin nhắn mới từ " + sender.getUsername();
            String message = messageContent.length() > 50 ?
                    messageContent.substring(0, 50) + "..." : messageContent;
            String link = "/chat/conversation/" + generateConversationId(senderId, receiverId);

            notificationService.createNotification(
                    receiverId, title, message,
                    Notification.NotificationType.INFO, link
            );

            // Gửi real-time notification qua WebSocket
            sendRealTimeNotification(receiverId, title, message, link);

            log.info("Chat notification sent to user: {}", receiverId);

        } catch (Exception e) {
            log.error("Error sending chat notification: {}", e.getMessage(), e);
        }
    }

    @Override
    public void sendNewConversationNotification(Long expertId, Long userId, String username) {
        try {
            String title = "Cuộc trò chuyện mới";
            String message = "Bạn có cuộc trò chuyện mới với " + username;
            String link = "/chat/conversation/" + generateConversationId(userId, expertId);

            notificationService.createNotification(
                    expertId, title, message,
                    Notification.NotificationType.INFO, link
            );

            // Gửi real-time notification
            sendRealTimeNotification(expertId, title, message, link);

            log.info("New conversation notification sent to expert: {}", expertId);

        } catch (Exception e) {
            log.error("Error sending new conversation notification: {}", e.getMessage(), e);
        }
    }

    @Override
    public void markMessageAsReadAndNotify(Long messageId, Long userId) {
        // Logic để đánh dấu tin nhắn đã đọc
        // Có thể gửi notification xác nhận nếu cần
    }

    private void sendRealTimeNotification(Long userId, String title, String message, String link) {
        // Gửi notification qua WebSocket
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                NotificationDTO.builder()
                        .title(title)
                        .message(message)
                        .link(link)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );
    }

    private String generateConversationId(Long user1Id, Long user2Id) {
        return user1Id < user2Id ?
                user1Id + "_" + user2Id : user2Id + "_" + user1Id;
    }
}
