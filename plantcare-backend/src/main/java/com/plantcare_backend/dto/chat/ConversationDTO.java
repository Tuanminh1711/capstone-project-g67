package com.plantcare_backend.dto.chat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDTO {
    private String conversationId;
    private Integer otherUserId;
    private String otherUsername;
    private String otherUserRole;
    private String lastMessage;
    private String lastMessageTime;
    private Boolean hasUnreadMessages;
}
