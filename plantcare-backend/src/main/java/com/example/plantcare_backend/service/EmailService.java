package com.example.plantcare_backend.service;

public interface EmailService {
    void sendResetCodeEmail(String to, String resetCode);
}
