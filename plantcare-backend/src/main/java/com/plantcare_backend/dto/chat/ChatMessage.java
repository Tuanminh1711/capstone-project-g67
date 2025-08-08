package com.plantcare_backend.dto.chat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private Integer senderId;
    private Integer receiverId;
    private String senderRole; // "VIP" hoặc "EXPERT"
    private String content;
    private String timestamp; // ISO string hoặc để backend tự sinh
    private String conversationId;
    private String chatType;
}
