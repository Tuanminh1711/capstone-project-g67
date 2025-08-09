package com.plantcare_backend.dto.request.expert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateArticleRequestDTO {
    @NotBlank(message = "Title must not be blank")
    private String title;

    @NotBlank(message = "Content must not be blank")
    private String content;

    @NotNull(message = "Category ID must not be null")
    private Long categoryId;

    @NotBlank(message = "Status must not be blank")
    private String status;

    private List<String> imageUrls;

    private List<ArticleImageUpdateDTO> imageUpdates;
} 