package com.plantcare_backend.dto.request.expert;

import lombok.Data;

@Data
public class ArticleImageUpdateDTO {
    private Long imageId;
    private String imageUrl;
    private String action;
} 