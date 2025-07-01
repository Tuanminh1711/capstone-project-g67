package com.plantcare_backend.dto.request.plantsManager;

import lombok.Data;

@Data
public class PlantImageUpdateDTO {
    private Long imageId; // ID của ảnh cần update (null nếu là ảnh mới)
    private String imageUrl; // URL mới của ảnh
    private String action; // "UPDATE", "DELETE", "ADD"
    private Boolean isPrimary; // Có phải ảnh chính không
}