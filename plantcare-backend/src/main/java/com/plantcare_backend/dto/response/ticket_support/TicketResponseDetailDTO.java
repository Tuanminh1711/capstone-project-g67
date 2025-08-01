package com.plantcare_backend.dto.response.ticket_support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDetailDTO {
    private Long responseId;
    private String content;
    private String imageUrl;
    private Timestamp createdAt;
    private String responderName; // Tên người trả lời
    private String responderRole; // Role của người trả lời (USER, ADMIN, STAFF)
}
