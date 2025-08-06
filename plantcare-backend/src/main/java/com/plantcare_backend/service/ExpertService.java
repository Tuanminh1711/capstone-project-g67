package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.expert.CreateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateArticleRequestDTO;
import com.plantcare_backend.dto.request.expert.ChangeArticleStatusRequestDTO;
import com.plantcare_backend.dto.response.expert.CategoryDetailResponse;
import com.plantcare_backend.model.ArticleCategory;
import com.plantcare_backend.model.Article;

import java.util.List;

public interface ExpertService {
    Long createCategoryByExpert(CreateCategoryRequestDTO createCategoryRequestDTO);

    List<CategoryDetailResponse> getAllCategories(int pageNo, int pageSize);
    
    Long updateCategoryByExpert(Long categoryId, UpdateCategoryRequestDTO updateCategoryRequestDTO);
    
    void deleteCategoryByExpert(Long categoryId);
    
    void changeCategoryStatus(Long categoryId, ArticleCategory.CategoryStatus status);
    
    Long createArticleByExpert(CreateArticleRequestDTO createArticleRequestDTO, Long expertId);
    
    void changeArticleStatus(Long articleId, Article.ArticleStatus status);
    
    List<Article> getArticlesByExpert(Long expertId, int pageNo, int pageSize);
}
