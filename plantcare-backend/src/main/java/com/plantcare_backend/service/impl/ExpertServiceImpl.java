package com.plantcare_backend.service.impl;
import com.plantcare_backend.dto.request.expert.CreateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateCategoryRequestDTO;
import com.plantcare_backend.dto.response.expert.CategoryDetailResponse;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.repository.ArticleCategoryRepository;
import com.plantcare_backend.service.ExpertService;

import com.plantcare_backend.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExpertServiceImpl implements ExpertService {
    @Autowired
    private final ArticleCategoryRepository articleCategoryRepository;

    @Override
    public Long createCategoryByExpert(CreateCategoryRequestDTO createCategoryRequestDTO) {
        if (articleCategoryRepository.existsByNameAndStatus(createCategoryRequestDTO.getName(), ArticleCategory.CategoryStatus.ACTIVE)) {
            throw new InvalidDataException("Category with name " + createCategoryRequestDTO.getName() + " already exists in the system. Please try another name.");
        }
        
        ArticleCategory category = new ArticleCategory();
        category.setName(createCategoryRequestDTO.getName());
        category.setDescription(createCategoryRequestDTO.getDescription());
        category.setStatus(ArticleCategory.CategoryStatus.ACTIVE);
        articleCategoryRepository.save(category);
        return category.getId();
    }

    @Override
    public List<CategoryDetailResponse> getAllCategories(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<ArticleCategory> categoriesPage = articleCategoryRepository.findByStatus(ArticleCategory.CategoryStatus.ACTIVE, pageable);

        return categoriesPage.getContent().stream()
                .map(articleCategory -> {
                    CategoryDetailResponse response = new CategoryDetailResponse();
                    response.setId(articleCategory.getId());
                    response.setCategoryName(articleCategory.getName());
                    response.setCategoryDescription(articleCategory.getDescription());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Long updateCategoryByExpert(Long categoryId, UpdateCategoryRequestDTO updateCategoryRequestDTO) {
        ArticleCategory category = articleCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + categoryId + " not found"));

        if (category.getStatus() != ArticleCategory.CategoryStatus.ACTIVE) {
            throw new ResourceNotFoundException("Category with id " + categoryId + " is not active");
        }

        if (!category.getName().equals(updateCategoryRequestDTO.getName()) && 
            articleCategoryRepository.existsByNameAndStatus(updateCategoryRequestDTO.getName(), ArticleCategory.CategoryStatus.ACTIVE)) {
            throw new InvalidDataException("Category with name " + updateCategoryRequestDTO.getName() + " already exists in the system. Please try another name.");
        }
        
        category.setName(updateCategoryRequestDTO.getName());
        category.setDescription(updateCategoryRequestDTO.getDescription());
        articleCategoryRepository.save(category);
        return category.getId();
    }

    @Override
    public void deleteCategoryByExpert(Long categoryId) {
        ArticleCategory category = articleCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + categoryId + " not found"));

        if (category.getStatus() != ArticleCategory.CategoryStatus.ACTIVE) {
            throw new ResourceNotFoundException("Category with id " + categoryId + " is not active");
        }

        category.setStatus(ArticleCategory.CategoryStatus.INACTIVE);
        articleCategoryRepository.save(category);
    }

    @Override
    public void changeCategoryStatus(Long categoryId, ArticleCategory.CategoryStatus status) {
        ArticleCategory category = articleCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        category.setStatus(ArticleCategory.CategoryStatus.valueOf(status.toString()));
        articleCategoryRepository.save(category);

        log.info("Category status changed to {}", status);
    }
}