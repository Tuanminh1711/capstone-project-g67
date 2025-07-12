package com.plantcare_backend.dto.response.ticket_support;

import com.plantcare_backend.model.SupportTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketListResponseDTO {
    private Long ticketId;
    private String title;
    private String description;
    private SupportTicket.TicketStatus status;
    private Timestamp createdAt;
    private String userName;
    private int responseCount; // Số lượng response
}
