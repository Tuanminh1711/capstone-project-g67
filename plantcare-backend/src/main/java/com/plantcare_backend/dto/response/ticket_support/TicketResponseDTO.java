package com.plantcare_backend.dto.response.ticket_support;

import com.plantcare_backend.model.SupportTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDTO {
    private Long ticketId;
    private String title;
    private String description;
    private String imageUrl;
    private SupportTicket.TicketStatus status;
    private Timestamp createdAt;
    private String userName; // Tên user tạo ticket
    private List<TicketResponseDetailDTO> responses;

    private String claimedByUserName;
    private Timestamp claimedAt;
    private String handledByUserName;
    private Timestamp handledAt;
    private List<TicketLogDTO> logs;
}
