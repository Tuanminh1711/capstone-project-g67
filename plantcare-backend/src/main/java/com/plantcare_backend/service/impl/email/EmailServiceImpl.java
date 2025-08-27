package com.plantcare_backend.service.impl.email;

import com.plantcare_backend.model.SupportTicket;
import com.plantcare_backend.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    @Autowired
    private final JavaMailSender emailSender;

    @Override
    public void sendResetCodeEmail(String to, String resetCode) {
        try {
            if (to == null || to.trim().isEmpty()) {
                throw new IllegalArgumentException("Email address cannot be null or empty");
            }
            if (resetCode == null || resetCode.trim().isEmpty()) {
                throw new IllegalArgumentException("Email address cannot be null or empty");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Reset Password Code");
            message.setText("Your reset password code is: " + resetCode +
                    "\nThis code will expire in 15 minutes." +
                    "\nIf you didn't request this, please ignore this email.");

            emailSender.send(message);
            log.info("Reset code email sent successfully to: {}", to);
        } catch (IllegalArgumentException e) {
            log.error("Failed to send reset code email to: {}", to, e);
            throw e;
        } catch (Exception e) {
            log.error("Failed to send reset code email to: {}", to, e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    @Override
    public void sendEmail(String to, String subject, String content) {
        try {
            if (to == null || to.trim().isEmpty()) {
                throw new IllegalArgumentException("Email address cannot be null or empty");
            }
            if (subject == null || subject.trim().isEmpty()) {
                throw new IllegalArgumentException("Subject cannot be null or empty");
            }
            if (content == null || content.trim().isEmpty()) {
                throw new IllegalArgumentException("Content cannot be null or empty");
            }

            boolean isHtml = content.contains("<html") || content.contains("<div") ||
                    content.contains("<p>") || content.contains("<a href");

            if (isHtml) {
                MimeMessage message = emailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);
                helper.setFrom("nguyentahoang15012003@gmail.com");

                emailSender.send(message);
            } else {
                MimeMessage message = emailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, false);
                helper.setFrom("hotrochamsoccaycanhtainha@gmail.com");

                emailSender.send(message);
            }
            log.info("Email sent successfully to: {}", to);
        } catch (IllegalArgumentException e) {
            log.error("Invalid email parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email:" + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendEmailAsync(String to, String subject, String content) {
        sendEmail(to, subject, content);
    }

    @Override
    public void sendWelcomeEmail(String email, String username, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        String subject = "Welcome to PlantCare - Your Account Has Been Created";
        String content = String.format(
                "Xin Chào %s,\n\n" +
                        "Tài khoản của bạn đã được tạo bởi quản trị viên.\n\n" +
                        "Thông tin đăng nhập:\n" +
                        "tài khoản: %s\n" +
                        "mật khẩu: %s\n\n" +
                        "Vui lòng thay đổi mật khẩu sau lần đăng nhập đầu tiên.\n\n" +
                        "Trân trọng,\nPlantCare Team",
                username, username, password
        );

        sendEmail(email, subject, content);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendTicketNotificationEmail(List<String> adminEmails, SupportTicket ticket, String adminPanelUrl) {
        if (adminEmails == null || adminEmails.isEmpty()) {
            log.warn("Admin emails list is null or empty");
            return;
        }

        List<String> validEmails = adminEmails.stream().filter(email -> email != null && !email.trim().isEmpty())
                .collect(Collectors.toList());
        String subject = "🔔 Ticket mới: " + ticket.getTitle();
        String content = String.format(
                "Chào Admin/Staff,\n\n" +
                        "Có ticket mới được tạo:\n\n" +
                        "📋 Tiêu đề: %s\n" +
                        "👤 Người tạo: %s\n" +
                        "📅 Thời gian: %s\n" +
                        "📝 Mô tả: %s\n\n" +45
                        "PlantCare Team",
                ticket.getTitle(),
                ticket.getUser().getUsername(),
                ticket.getCreatedAt(),
                ticket.getDescription(),
                ticket.getTicketId()
        );

        for (String email : validEmails) {
            try {
                sendEmailAsync(email, subject, content);
                log.debug("✅ Email queued for admin: {}", email);
            } catch (Exception e) {
                log.error("❌ Failed to queue email for admin {}: {}", email, e.getMessage());
            }
        }

        log.info("✅ All {} emails queued for ticket #{}", validEmails.size(), ticket.getTicketId());
    }
}
