package com.plantcare_backend.service.impl;

import com.plantcare_backend.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {
    @Autowired
    private JavaMailSender emailSender;

    @Override
    public void sendResetCodeEmail(String to, String resetCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Reset Password Code");
            message.setText("Your reset password code is: " + resetCode +
                    "\nThis code will expire in 15 minutes." +
                    "\nIf you didn't request this, please ignore this email.");

            emailSender.send(message);
            log.info("Reset code email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send reset code email to: {}", to, e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
