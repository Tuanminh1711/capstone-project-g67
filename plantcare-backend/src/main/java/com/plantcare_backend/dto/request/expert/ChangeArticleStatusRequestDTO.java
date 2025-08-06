package com.plantcare_backend.dto.request.expert;

import com.plantcare_backend.model.Article;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeArticleStatusRequestDTO {

    @NotNull(message = "Article status must not be null")
    private Article.ArticleStatus status;
} 