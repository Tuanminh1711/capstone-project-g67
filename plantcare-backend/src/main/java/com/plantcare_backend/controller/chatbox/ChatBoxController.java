package com.plantcare_backend.controller.chatbox;

import com.plantcare_backend.dto.request.chatbox.ChatRequestDTO;
import com.plantcare_backend.dto.response.chatbox.ChatResponseDTO;
import com.plantcare_backend.service.chatbox.ChatService;
import com.plantcare_backend.service.ActivityLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
@Tag(name = "chatbox", description = "chat box AI")
@CrossOrigin(origins = "http://localhost:4200/")
@Slf4j
public class ChatBoxController {
    @Autowired
    private final ChatService chatService;

    @Autowired
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request, HttpServletRequest httpRequest) {
        try {
            // Input validation
            if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                log.warn("Empty message received");
                return ResponseEntity.badRequest()
                    .body(new ChatResponseDTO("Message cannot be empty"));
            }
            
            String message = request.getMessage().trim();
            if (message.length() > 1000) {
                log.warn("Message too long: {} characters", message.length());
                return ResponseEntity.badRequest()
                    .body(new ChatResponseDTO("Message too long (max 1000 characters)"));
            }
            
            log.info("Processing chat request with message length: {}", message.length());
            
            // Get user ID safely
            Long userId = getUserIdFromRequest(httpRequest);
            if (userId != null) {
                log.info("User {} is chatting with AI", userId);
            }
            
            // Call AI service
            String reply;
            try {
                reply = chatService.askAI(message);
                log.info("AI response received successfully");
            } catch (Exception e) {
                log.error("AI service error: {}", e.getMessage());
                return ResponseEntity.status(503)
                    .body(new ChatResponseDTO("AI service temporarily unavailable. Please try again."));
            }
            
            // Validate AI response
            if (reply == null || reply.trim().isEmpty()) {
                log.warn("Empty response from AI service");
                return ResponseEntity.status(503)
                    .body(new ChatResponseDTO("No response from AI service"));
            }
            
            // Log activity
            if (userId != null) {
                try {
                    activityLogService.logActivity(userId.intValue(), "CHAT_WITH_AI",
                            "Chat with AI: " + message.substring(0, Math.min(50, message.length())),
                            httpRequest);
                    log.debug("Activity logged for user {}", userId);
                } catch (Exception e) {
                    log.warn("Failed to log activity for user {}: {}", userId, e.getMessage());
                    // Don't fail the request if logging fails
                }
            }
            
            return ResponseEntity.ok(new ChatResponseDTO(reply));
            
        } catch (Exception e) {
            log.error("Unexpected error in chat endpoint", e);
            return ResponseEntity.status(500)
                .body(new ChatResponseDTO("Internal server error"));
        }
    }

    @PostMapping("/router")
    public ResponseEntity<ChatResponseDTO> chatRouter(@RequestBody ChatRequestDTO request) {
        try {
            // Input validation
            if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                log.warn("Empty message received in router endpoint");
                return ResponseEntity.badRequest()
                    .body(new ChatResponseDTO("Message cannot be empty"));
            }
            
            String message = request.getMessage().trim();
            if (message.length() > 1000) {
                log.warn("Message too long in router endpoint: {} characters", message.length());
                return ResponseEntity.badRequest()
                    .body(new ChatResponseDTO("Message too long (max 1000 characters)"));
            }
            
            log.info("Processing OpenRouter request with message length: {}", message.length());
            
            // Call OpenRouter service
            String reply;
            try {
                reply = chatService.askOpenRouter(message);
                log.info("OpenRouter response received successfully");
            } catch (Exception e) {
                log.error("OpenRouter service error: {}", e.getMessage());
                return ResponseEntity.status(503)
                    .body(new ChatResponseDTO("OpenRouter service temporarily unavailable"));
            }
            
            // Validate response
            if (reply == null || reply.trim().isEmpty()) {
                log.warn("Empty response from OpenRouter service");
                return ResponseEntity.status(503)
                    .body(new ChatResponseDTO("No response from OpenRouter"));
            }
            
            return ResponseEntity.ok(new ChatResponseDTO(reply));
            
        } catch (Exception e) {
            log.error("Unexpected error in chatRouter endpoint", e);
            return ResponseEntity.status(500)
                .body(new ChatResponseDTO("Internal server error"));
        }
    }
    
    // Helper method to safely get user ID
    private Long getUserIdFromRequest(HttpServletRequest request) {
        try {
            Object userIdObj = request.getAttribute("userId");
            if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            }
            return null;
        } catch (Exception e) {
            log.warn("Error getting userId from request: {}", e.getMessage());
            return null;
        }
    }
}
