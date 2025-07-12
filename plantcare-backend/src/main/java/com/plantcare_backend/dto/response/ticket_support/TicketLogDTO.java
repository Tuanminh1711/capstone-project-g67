package com.plantcare_backend.dto.response.ticket_support;

import com.plantcare_backend.model.SupportTicketLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketLogDTO {
    private Long logId;
    private SupportTicketLog.Action action;
    private String userName;
    private String note;
    private Timestamp createdAt;
}
