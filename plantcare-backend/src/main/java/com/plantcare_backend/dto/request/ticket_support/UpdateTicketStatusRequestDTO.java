package com.plantcare_backend.dto.request.ticket_support;

import com.plantcare_backend.model.SupportTicket;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketStatusRequestDTO {
    @NotNull(message = "Status is required")
    private SupportTicket.TicketStatus status;
}
