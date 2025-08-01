package com.plantcare_backend.service;

import com.plantcare_backend.model.SupportTicket;
import org.springframework.scheduling.annotation.Async;

import java.util.List;

public interface EmailService {
    void sendResetCodeEmail(String to, String resetCode);

    void sendEmail(String to, String subject, String content);

    @Async
    void sendEmailAsync(String to, String subject, String content);

    void sendWelcomeEmail(String email, String username, String password);

    void sendTicketNotificationEmail(List<String> adminEmails, SupportTicket ticket, String adminPanelUrl);
}
