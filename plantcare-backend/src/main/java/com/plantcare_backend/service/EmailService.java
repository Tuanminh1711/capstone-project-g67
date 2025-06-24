package com.plantcare_backend.service;

public interface EmailService {
    void sendResetCodeEmail(String to, String resetCode);
    void sendEmail(String to, String subject, String content);
}
