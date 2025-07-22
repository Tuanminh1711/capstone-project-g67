package com.plantcare_backend.controller.chatbox;

import com.plantcare_backend.dto.request.chatbox.ChatRequestDTO;
import com.plantcare_backend.dto.response.chatbox.ChatResponseDTO;
import com.plantcare_backend.service.chatbox.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
@Tag(name = "chatbox", description = "chat box AI")
@CrossOrigin(origins = "http://localhost:4200/")
public class ChatBoxController {
    @Autowired
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request) {
        String reply = chatService.askAI(request.getMessage());
        ChatResponseDTO response = new ChatResponseDTO();
        response.setReply(reply);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/router")
    public ResponseEntity<ChatResponseDTO> chatRouter(@RequestBody ChatRequestDTO request) {
        String reply = chatService.askOpenRouter(request.getMessage());
        ChatResponseDTO response = new ChatResponseDTO();
        response.setReply(reply);
        return ResponseEntity.ok(response);
    }
}
