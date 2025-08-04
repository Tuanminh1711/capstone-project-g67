package com.plantcare_backend.dto.request.expert;

import com.plantcare_backend.model.ArticleCategory;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChangeCategoryStatusRequestDTO {
    @NotNull(message = "Status cannot be null")
    private ArticleCategory.CategoryStatus status;
} 