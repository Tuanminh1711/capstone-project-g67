package com.plantcare_backend.service.EmailServiceTest;

import com.plantcare_backend.service.impl.EmailServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.AssertionsKt.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SendEmailTest {
    @InjectMocks
    private EmailServiceImpl emailService;

    @Mock
    private JavaMailSender emailSender;

    @Captor
    ArgumentCaptor<SimpleMailMessage> mailCaptor;

    String to = "recipient@example.com";
    String subject = "Test Subject";
    String content = "This is a test email.";

    @Test
    void sendEmail_success() {
        try {
            emailService.sendEmail(to, subject, content);

            verify(emailSender, times(1)).send(mailCaptor.capture());
            SimpleMailMessage sentMail = mailCaptor.getValue();

            assertNotNull(sentMail);
            assertArrayEquals(new String[]{to}, sentMail.getTo());
            assertEquals(subject, sentMail.getSubject());
            assertEquals(content, sentMail.getText());
            assertEquals("nguyentahoang15012003@gmail.com", sentMail.getFrom());
            System.out.println("Test 'sendEmail_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_success' thất bại: " + e.getMessage());
        }

    }

    @Test
    void sendEmail_failSendingEmail() {
        try {
            doThrow(new MailSendException("Sending failed"))
                    .when(emailSender).send(any(SimpleMailMessage.class));

            MailSendException ex = assertThrows(MailSendException.class, () -> {
                emailService.sendEmail(to, subject, content);
            });
            System.out.println("Test 'sendEmail_failSendingEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_failSendingEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendEmail_invalidEmail() {
        try {
            to = "invalid-email";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendEmail(to, subject, content);
            });

            assertEquals("Invalid email address: " + to, ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendEmail_invalidEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_invalidEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendEmail_emptySubject() {
        try {
            subject = "";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendEmail(to, subject, content);
            });

            assertEquals("Subject cannot be null or empty", ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendEmail_emptySubject' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_emptySubject' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendEmail_emptyContent() {
        try {
            content = "";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendEmail(to, subject, content);
            });

            assertEquals("Content cannot be null or empty", ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendEmail_emptyContent' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_emptyContent' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendEmail_emptyEmailAddress() {
        try {
            to = "";

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendEmail(to, subject, content);
            });

            assertEquals("Email address cannot be null or empty", ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendEmail_emptyEmailAddress' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendEmail_emptyEmailAddress' thất bại: " + e.getMessage());
        }
    }
}
