package com.plantcare_backend.service;

public interface ChatNotificationService {
    /**
     * Gửi notification khi có tin nhắn mới
     */
    void sendChatNotification(Long senderId, Long receiverId, String messageContent);

    /**
     * Gửi notification khi có tin nhắn community mới
     */
    void sendCommunityChatNotification(Long senderId, String messageContent);
}
