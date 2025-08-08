package com.plantcare_backend.controller.WebSocket;

import com.plantcare_backend.dto.chat.ChatMessage;
import com.plantcare_backend.dto.chat.ConversationDTO;
import com.plantcare_backend.dto.request.expert.ExpertDTO;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.ChatMessageRepository;
import com.plantcare_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.AccessDeniedException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@Slf4j
@RequestMapping("/api/chat")
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
        log.info("Received chat message: {}", chatMessage);

        try {
            if (chatMessage.getSenderId() == null) {
                throw new IllegalArgumentException("Sender ID cannot be null");
            }

            if (chatMessage.getContent() == null || chatMessage.getContent().trim().isEmpty()) {
                throw new IllegalArgumentException("Message content cannot be empty");
            }

            if (chatMessage.getContent().trim().length() > 1000) {
                throw new IllegalArgumentException("Message content too long (max 1000 characters)");
            }

            Optional<Users> senderOpt = userRepository.findByIdWithRole(Long.valueOf(chatMessage.getSenderId()));
            if (senderOpt.isEmpty()) {
                throw new IllegalArgumentException("Sender not found");
            }

            Users sender = senderOpt.get();
            log.info("Sender found: {} with role: {}", sender.getUsername(), sender.getRole().getRoleName());

            Users receiver = null;
            if (chatMessage.getReceiverId() != null) {
                Optional<Users> receiverOpt = userRepository.findById(chatMessage.getReceiverId());
                receiver = receiverOpt.orElse(null);
                log.info("Receiver found: {}", receiver != null ? receiver.getUsername() : "null");
            }

            if (!sender.getRole().getRoleName().equals(Role.RoleName.VIP) &&
                    !sender.getRole().getRoleName().equals(Role.RoleName.EXPERT)) {
                throw new AccessDeniedException("Chỉ tài khoản VIP hoặc Chuyên gia mới được chat.");
            }

            // Create and save message entity
            com.plantcare_backend.model.ChatMessage entity = com.plantcare_backend.model.ChatMessage.builder()
                    .sender(sender)
                    .receiver(null)
                    .content(chatMessage.getContent().trim())
                    .sentAt(Timestamp.from(Instant.now()))
                    .isRead(false)
                    .chatType(com.plantcare_backend.model.ChatMessage.ChatType.COMMUNITY)
                    .build();

            chatMessageRepository.save(entity);
            log.info("Chat message saved with ID: {}", entity.getMessageId());

            // Set response data
            chatMessage.setTimestamp(entity.getSentAt().toInstant().toString());
            chatMessage.setSenderRole(sender.getRole().getRoleName().name());

            log.info("Broadcasting message to /topic/vip-community: {}", chatMessage);
            return chatMessage;

        } catch (Exception e) {
            log.error("Error processing chat message: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/history")
    public List<ChatMessage> getChatHistory(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "50") int size) {
        log.info("Fetching chat history... page: {}, size: {}", page, size);
        try {
            List<com.plantcare_backend.model.ChatMessage> entities = chatMessageRepository.findAll();
            log.info("Found {} chat messages in database", entities.size());

            if (entities.isEmpty()) {
                log.info("No chat messages found in database");
                return List.of();
            }

            List<ChatMessage> result = entities.stream()
                    .map(entity -> {
                        try {
                            log.debug("Processing entity: ID={}, Sender={}, Content={}",
                                    entity.getMessageId(),
                                    entity.getSender() != null ? entity.getSender().getUsername() : "null",
                                    entity.getContent());

                            ChatMessage dto = ChatMessage.builder()
                                    .senderId(entity.getSender() != null ? entity.getSender().getId() : null)
                                    .receiverId(entity.getReceiver() != null ? entity.getReceiver().getId() : null)
                                    .senderRole(entity.getSender() != null && entity.getSender().getRole() != null
                                            ? entity.getSender().getRole().getRoleName().name()
                                            : null)
                                    .content(entity.getContent())
                                    .timestamp(entity.getSentAt() != null ? entity.getSentAt().toInstant().toString()
                                            : null)
                                    .build();

                            log.debug("Converted to DTO: {}", dto);
                            return dto;
                        } catch (Exception e) {
                            log.error("Error converting entity to DTO: {}", e.getMessage(), e);
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            log.info("Successfully converted {} chat messages to DTOs", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error fetching chat history: {}", e.getMessage(), e);
            return List.of();
        }
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(Throwable exception) {
        log.error("WebSocket error: ", exception);
        return "Error: " + exception.getMessage();
    }

    @MessageMapping("/chat.sendPrivateMessage")
    @SendToUser("/queue/private-messages")
    public ChatMessage sendPrivateMessage(@Payload ChatMessage chatMessage) throws AccessDeniedException {
        log.info("Received private chat message: {}", chatMessage);

        try {
            if (chatMessage.getSenderId() == null || chatMessage.getReceiverId() == null) {
                throw new IllegalArgumentException("Sender ID and Receiver ID cannot be null");
            }

            if (chatMessage.getContent() == null || chatMessage.getContent().trim().isEmpty()) {
                throw new IllegalArgumentException("Message content cannot be empty");
            }

            Optional<Users> senderOpt = userRepository.findByIdWithRole(Long.valueOf(chatMessage.getSenderId()));
            Optional<Users> receiverOpt = userRepository.findByIdWithRole(Long.valueOf(chatMessage.getReceiverId()));

            if (senderOpt.isEmpty() || receiverOpt.isEmpty()) {
                throw new IllegalArgumentException("Sender or Receiver not found");
            }

            Users sender = senderOpt.get();
            Users receiver = receiverOpt.get();

            if (!sender.getRole().getRoleName().equals(Role.RoleName.VIP) &&
                    !sender.getRole().getRoleName().equals(Role.RoleName.EXPERT)) {
                throw new AccessDeniedException("Chỉ tài khoản VIP hoặc Chuyên gia mới được chat private.");
            }

            // Tạo conversation ID
            String conversationId = generateConversationId(chatMessage.getSenderId(), chatMessage.getReceiverId());

            // Create and save message entity
            com.plantcare_backend.model.ChatMessage entity = com.plantcare_backend.model.ChatMessage.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .content(chatMessage.getContent().trim())
                    .sentAt(Timestamp.from(Instant.now()))
                    .isRead(false)
                    .chatType(com.plantcare_backend.model.ChatMessage.ChatType.PRIVATE)
                    .conversationId(conversationId)
                    .build();

            chatMessageRepository.save(entity);
            log.info("Private chat message saved with ID: {}", entity.getMessageId());

            // Set response data
            chatMessage.setTimestamp(entity.getSentAt().toInstant().toString());
            chatMessage.setSenderRole(sender.getRole().getRoleName().name());
            chatMessage.setConversationId(conversationId);

            return chatMessage;

        } catch (Exception e) {
            log.error("Error processing private chat message: {}", e.getMessage(), e);
            throw e;
        }
    }

    // hepler method để tạo conversation ID
    private String generateConversationId(Integer user1Id, Integer user2Id) {
        // Sắp xếp ID để đảm bảo conversation ID nhất quán
        int minId = Math.min(user1Id, user2Id);
        int maxId = Math.max(user1Id, user2Id);
        return "conv_" + minId + "_" + maxId;
    }

    // API để lấy private messages
    @GetMapping("/private/{receiverId}")
    public List<ChatMessage> getPrivateMessages(@PathVariable Integer receiverId,
                                                @RequestAttribute("userId") Integer senderId) {
        log.info("Fetching private messages between {} and {}", senderId, receiverId);

        try {
            List<com.plantcare_backend.model.ChatMessage> entities =
                    chatMessageRepository.findPrivateMessages(senderId, receiverId);

            return entities.stream()
                    .map(entity -> ChatMessage.builder()
                            .senderId(entity.getSender().getId())
                            .receiverId(entity.getReceiver().getId())
                            .senderRole(entity.getSender().getRole().getRoleName().name())
                            .content(entity.getContent())
                            .timestamp(entity.getSentAt().toInstant().toString())
                            .conversationId(entity.getConversationId())
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching private messages: {}", e.getMessage(), e);
            return List.of();
        }
    }

    @GetMapping("/conversations")
    public List<ConversationDTO> getConversations(@RequestAttribute("userId") Integer userId) {
        log.info("Fetching conversations for user: {}", userId);

        try {
            // Lấy thông tin user hiện tại
            Optional<Users> currentUser = userRepository.findById(userId);
            if (currentUser.isEmpty()) {
                return List.of();
            }

            Users user = currentUser.get();
            List<String> conversationIds = chatMessageRepository.findConversationIdsByUserId(userId);

            return conversationIds.stream()
                    .map(convId -> {
                        String[] parts = convId.split("_");
                        Integer otherUserId = parts[1].equals(userId.toString()) ?
                                Integer.parseInt(parts[2]) : Integer.parseInt(parts[1]);

                        Optional<Users> otherUser = userRepository.findById(otherUserId);

                        // Nếu là VIP user, chỉ hiển thị conversations với experts
                        if (user.getRole().getRoleName() == Role.RoleName.VIP) {
                            if (otherUser.isEmpty() ||
                                    otherUser.get().getRole().getRoleName() != Role.RoleName.EXPERT) {
                                return null; // Bỏ qua conversations không phải với expert
                            }
                        }

                        return ConversationDTO.builder()
                                .conversationId(convId)
                                .otherUserId(otherUserId)
                                .otherUsername(otherUser.map(Users::getUsername).orElse("Unknown"))
                                .otherUserRole(otherUser.map(u -> u.getRole().getRoleName().name()).orElse(""))
                                .build();
                    })
                    .filter(Objects::nonNull) // Lọc bỏ null values
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching conversations: {}", e.getMessage(), e);
            return List.of();
        }
    }

    // API để mark messages as read
    @PostMapping("/mark-read")
    public ResponseEntity<String> markMessagesAsRead(@RequestAttribute("userId") Integer userId) {
        try {
            chatMessageRepository.markMessagesAsRead(userId);
            return ResponseEntity.ok("Messages marked as read");
        } catch (Exception e) {
            log.error("Error marking messages as read: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error marking messages as read");
        }
    }

    @GetMapping("/experts")
    public ResponseEntity<List<ExpertDTO>> getExperts() {
        try {
            List<Users> experts = userRepository.findAllExperts();
            List<ExpertDTO> expertDTOs = experts.stream()
                    .map(expert -> ExpertDTO.builder()
                            .id(expert.getId())
                            .username(expert.getUsername())
                            .role(expert.getRole().getRoleName().name())
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(expertDTOs);
        } catch (Exception e) {
            log.error("Error fetching experts: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}