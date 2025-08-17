package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.expert.ArticleDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.ArticleResponseDTO;
import org.springframework.data.domain.Page;

public interface UserViewArticleService  {
    Page<ArticleResponseDTO> getAllArticles(int page, int size);

    ArticleDetailResponseDTO getArticleDetail(Long id);

    ArticleDetailResponseDTO toArticleDetailDTO(ArticleDetailResponseDTO fullDto);
}
