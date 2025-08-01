package com.plantcare_backend.service;

import com.plantcare_backend.model.SupportTicket;
import org.springframework.stereotype.Service;

import java.util.List;


public interface AdminNotificationService {
    /**
     * Gửi notification cho admin/staff khi có ticket mới
     */
    void notifyNewTicket(SupportTicket ticket);

    /**
     * Gửi notification khi ticket được claim
     */
    void notifyTicketClaimed(SupportTicket ticket, String claimedByUsername);

    /**
     * Gửi notification khi ticket được handle
     */
    void notifyTicketHandled(SupportTicket ticket, String handledByUsername);
}