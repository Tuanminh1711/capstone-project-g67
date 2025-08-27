package com.plantcare_backend.service.impl.admin;

import com.plantcare_backend.model.SupportTicket;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.service.AdminNotificationService;
import com.plantcare_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationServiceImpl implements AdminNotificationService {
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Value("${plantcare.admin-panel-url:http://localhost:4200/admin}")
    private String adminPanelUrl;

    @Override
    @Async("emailTaskExecutor")
    public void notifyNewTicket(SupportTicket ticket) {
        try {
            List<String> adminEmails = getAdminStaffEmails();

            if (!adminEmails.isEmpty()) {
                emailService.sendTicketNotificationEmail(adminEmails, ticket, adminPanelUrl);
                log.info("Sent ticket notification to {} admin/staff members for ticket #{}", adminEmails.size(), ticket.getTicketId());
            } else {
                log.warn("No admin/staff emails found for ticket notification #{}", ticket.getTicketId());
            }
        } catch (Exception e) {
            log.error("Failed to send admin notification for ticket: {}", ticket.getTicketId(), e);
        }
    }

    @Override
    public void notifyTicketClaimed(SupportTicket ticket, String claimedByUsername) {
        // Implementation cho notification khi ticket được claim
    }

    @Override
    public void notifyTicketHandled(SupportTicket ticket, String handledByUsername) {
        // Implementation cho notification khi ticket được handle
    }

    private List<String> getAdminStaffEmails() {
        return userRepository.findByRole_RoleNameIn(Arrays.asList("ADMIN", "STAFF")).stream()
                .map(Users::getEmail).collect(Collectors.toList());
    }
}
