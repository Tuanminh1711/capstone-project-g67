package com.plantcare_backend.service;

public interface ChatNotificationService {
    /**
     * Gửi notification khi có tin nhắn mới
     */
    void sendChatNotification(Long senderId, Long receiverId, String messageContent);

    /**
     * Gửi notification khi có conversation mới
     */
    void sendNewConversationNotification(Long expertId, Long userId, String username);

    /**
     * Đánh dấu tin nhắn đã đọc và gửi notification
     */
    void markMessageAsReadAndNotify(Long messageId, Long userId);
}
