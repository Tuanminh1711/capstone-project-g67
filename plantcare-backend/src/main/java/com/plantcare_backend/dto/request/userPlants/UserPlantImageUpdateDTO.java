package com.plantcare_backend.dto.request.userPlants;

import lombok.Data;

@Data
public class UserPlantImageUpdateDTO {
    private Long imageId; // ID của ảnh cần update (null nếu là ảnh mới)
    private String imageUrl; // URL mới của ảnh
    private String action; // "UPDATE", "DELETE", "ADD"
    private String description;
}