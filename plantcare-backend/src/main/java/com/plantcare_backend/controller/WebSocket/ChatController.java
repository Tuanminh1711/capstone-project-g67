package com.plantcare_backend.controller.WebSocket;

import com.plantcare_backend.dto.chat.ChatMessage;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.ChatMessageRepository;
import com.plantcare_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.AccessDeniedException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class ChatController {
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Autowired
    public ChatController(UserRepository userRepository, ChatMessageRepository chatMessageRepository) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/vip-community")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) throws AccessDeniedException {
        Users sender = userRepository.findByIdWithRole(Long.valueOf(chatMessage.getSenderId())).orElseThrow();
        Users receiver = userRepository.findById(chatMessage.getReceiverId()).orElse(null);
        if (!sender.getRole().getRoleName().equals(Role.RoleName.VIP) &&
                !sender.getRole().getRoleName().equals(Role.RoleName.EXPERT)) {
            throw new AccessDeniedException("Chỉ tài khoản VIP hoặc Chuyên gia mới được chat.");
        }
        com.plantcare_backend.model.ChatMessage entity = com.plantcare_backend.model.ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatMessage.getContent())
                .sentAt(Timestamp.from(Instant.now()))
                .isRead(false)
                .build();

        chatMessageRepository.save(entity);
        chatMessage.setTimestamp(entity.getSentAt().toInstant().toString());
        chatMessage.setSenderRole(sender.getRole().getRoleName().name());
        return chatMessage;
    }

    @GetMapping("/chat/history")
    @PreAuthorize("hasAnyRole('VIP', 'EXPERT')")
    public List<ChatMessage> getChatHistory() {
        List<com.plantcare_backend.model.ChatMessage> entities = chatMessageRepository.findAll();
        return entities.stream()
                .map(entity -> ChatMessage.builder()
                        .senderId(entity.getSender() != null ? entity.getSender().getId() : null)
                        .receiverId(entity.getReceiver() != null ? entity.getReceiver().getId() : null)
                        .senderRole(entity.getSender() != null ? entity.getSender().getRole().getRoleName().name() : null)
                        .content(entity.getContent())
                        .timestamp(entity.getSentAt() != null ? entity.getSentAt().toInstant().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }
}