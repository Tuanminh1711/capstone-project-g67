package com.plantcare_backend.service.emailServiceTest;

import com.plantcare_backend.service.impl.EmailServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class SendWelcomeEmailTest {
    @Mock
    private JavaMailSender emailSender;

    @Spy
    @InjectMocks
    private EmailServiceImpl emailService;

    String to = "user@example.com";
    String username = "testUser";
    String password = "123456";

    String expectedSubject = "Welcome to PlantCare - Your Account Has Been Created";
    String expectedContent = String.format(
            "Xin Chào %s,\n\n" +
                    "Tài khoản của bạn đã được tạo bởi quản trị viên.\n\n" +
                    "Thông tin đăng nhập:\n" +
                    "tài khoản: %s\n" +
                    "mật khẩu: %s\n\n" +
                    "Vui lòng thay đổi mật khẩu sau lần đăng nhập đầu tiên.\n\n" +
                    "Trân trọng,\nPlantCare Team",
            username, username, password
    );
    @Test
    void sendWelcomeEmail_success() {
        try {
            emailService.sendWelcomeEmail(to, username, password);

            verify(emailService, times(1)).sendEmail(eq(to), eq(expectedSubject), eq(expectedContent));
            System.out.println("Test 'sendWelcomeEmail_success' thành công");
        } catch (Exception e) {
            System.out.println("Test 'sendWelcomeEmail_success' thất bại: " + e.getMessage());
        }
    }
}
