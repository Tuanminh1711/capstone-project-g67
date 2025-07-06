package com.plantcare_backend.dto.request.plantcare;

import lombok.Data;

@Data
public class CareCompletionRequest {
    private String notes;
    private String imageUrl;
}
