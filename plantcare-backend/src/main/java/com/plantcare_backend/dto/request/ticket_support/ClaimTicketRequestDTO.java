package com.plantcare_backend.dto.request.ticket_support;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimTicketRequestDTO {
    @NotBlank(message = "Note is required")
    private String note;
}
