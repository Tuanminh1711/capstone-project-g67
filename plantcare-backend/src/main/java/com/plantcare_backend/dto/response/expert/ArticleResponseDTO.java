package com.plantcare_backend.dto.response.expert;

import com.plantcare_backend.model.Article;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleResponseDTO {
    private Long id;
    private String title;
    private String categoryName;
    private List<String> imageUrls;
}