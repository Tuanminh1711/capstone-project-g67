package com.plantcare_backend.service;

import org.springframework.scheduling.annotation.Async;

public interface EmailService {
    void sendResetCodeEmail(String to, String resetCode);
    void sendEmail(String to, String subject, String content);
    @Async
    void sendEmailAsync(String to, String subject, String content);
}
