package com.plantcare_backend.service.chatbox;

public interface ChatService {
    String askOpenAI(String message);

    String askOpenRouter(String message);

    String askAI(String message); // Method mặc định sử dụng OpenRouter
}
