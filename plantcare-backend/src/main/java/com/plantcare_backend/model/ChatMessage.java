package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private Users sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private Users receiver;

    private String content;

    @Column(name = "sent_at")
    private Timestamp sentAt;

    private Boolean isRead;

    @Enumerated(EnumType.STRING)
    @Column(name = "chat_type")
    private ChatType chatType;

    @Column(name = "conversation_id")
    private String conversationId;

    public enum ChatType {
        COMMUNITY, // Group chat
        PRIVATE    // 1-1 chat
    }
}
