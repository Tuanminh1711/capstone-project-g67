package com.plantcare_backend.dto.response.expert;

import com.plantcare_backend.model.Article;
import lombok.Data;

import java.util.List;

@Data
public class ArticleDetailResponseDTO {
    private Long id;
    private String title;
    private String content;
    private String categoryName;
    private String authorName;
    private Article.ArticleStatus status;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
    private List<String> imageUrls;
    private List<ArticleImageDetailDTO> images;
} 