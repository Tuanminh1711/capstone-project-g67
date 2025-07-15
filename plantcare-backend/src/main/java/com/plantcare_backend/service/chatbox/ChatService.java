package com.plantcare_backend.service.chatbox;

public interface ChatService {
    String askOpenAI(String message);
    String askOpenRouter(String message);
}
