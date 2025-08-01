package com.plantcare_backend.service.emailServiceTest;

import com.plantcare_backend.service.impl.EmailServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SendResetCodeEmailTest {

    @Mock
    private JavaMailSender emailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    String to = "user@example.com";
    String resetCode = "ABC123";

    @Test
    void sendResetCodeEmail_success() {
        try {
            emailService.sendResetCodeEmail(to, resetCode);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(emailSender).send(captor.capture());

            SimpleMailMessage sentMessage = captor.getValue();
            assertEquals(to, sentMessage.getTo()[0]);
            assertEquals("Reset Password Code", sentMessage.getSubject());
            assertTrue(sentMessage.getText().contains("Your reset password code is: " + resetCode));
            assertTrue(sentMessage.getText().contains("This code will expire in 15 minutes."));
            System.out.println("Test 'sendResetCodeEmail_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'sendResetCodeEmail_success' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendResetCodeEmail_sendFails() {
        try {
            doThrow(new MailSendException("SMTP connection failed"))
                    .when(emailSender).send(any(SimpleMailMessage.class));

            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    emailService.sendResetCodeEmail(to, resetCode));

            assertTrue(ex.getMessage().contains("Failed to send email"));
            verify(emailSender).send(any(SimpleMailMessage.class));

            System.out.println("Test 'sendResetCodeEmail_sendFails' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendResetCodeEmail_sendFails' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendResetCodeEmail_invalidEmail() {
        to = "invalid-email";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendResetCodeEmail(to, resetCode);
            });

            assertEquals("Invalid email address: " + to, ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendResetCodeEmail_invalidEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendResetCodeEmail_invalidEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendResetCodeEmail_nullEmail() {
        to = "";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendResetCodeEmail(to, resetCode);
            });

            verify(emailSender).send(any(SimpleMailMessage.class));
            assertEquals("Email address cannot be null or empty", ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendResetCodeEmail_nullEmail' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendResetCodeEmail_nullEmail' thất bại: " + e.getMessage());
        }
    }

    @Test
    void sendResetCodeEmail_nullResetCode() {
        resetCode = "";
        try {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
                emailService.sendResetCodeEmail(to, resetCode);
            });

            verify(emailSender).send(any(SimpleMailMessage.class));
            assertEquals("Reset code address cannot be null or empty", ex.getMessage());
            verify(emailSender, never()).send((MimeMessage) any());

            System.out.println("Test 'sendResetCodeEmail_nullResetCode' thành công");
            System.out.println(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        } catch (Exception e) {
            System.out.println("Test 'sendResetCodeEmail_nullResetCode' thất bại: " + e.getMessage());
        }
    }
}
