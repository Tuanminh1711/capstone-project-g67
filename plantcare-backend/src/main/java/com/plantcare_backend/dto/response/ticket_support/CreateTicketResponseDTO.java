package com.plantcare_backend.dto.response.ticket_support;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketResponseDTO {
    @NotBlank(message = "Content is required")
    private String content;
}
