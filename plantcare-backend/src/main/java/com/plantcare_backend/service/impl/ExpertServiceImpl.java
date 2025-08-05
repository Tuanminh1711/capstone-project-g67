package com.plantcare_backend.service.impl;
import com.plantcare_backend.dto.request.expert.CreateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateArticleRequestDTO;
import com.plantcare_backend.dto.response.expert.CategoryDetailResponse;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.repository.ArticleCategoryRepository;
import com.plantcare_backend.repository.ArticleRepository;
import com.plantcare_backend.repository.ArticleImageRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.ExpertService;

import com.plantcare_backend.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExpertServiceImpl implements ExpertService {
    @Autowired
    private final ArticleCategoryRepository articleCategoryRepository;
    
    @Autowired
    private final ArticleRepository articleRepository;
    
    @Autowired
    private final ArticleImageRepository articleImageRepository;
    
    @Autowired
    private final UserRepository userRepository;

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

    @Override
    public Long createArticleByExpert(CreateArticleRequestDTO createArticleRequestDTO, Long expertId) {
        ArticleCategory category = articleCategoryRepository.findById(createArticleRequestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        if (category.getStatus() != ArticleCategory.CategoryStatus.ACTIVE) {
            throw new ResourceNotFoundException("Category is not active");
        }

        Users expert = userRepository.findById(expertId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Expert not found"));

        if (articleRepository.existsByTitleIgnoreCase(createArticleRequestDTO.getTitle())) {
            throw new InvalidDataException("Article with title already exists: " + createArticleRequestDTO.getTitle());
        }

        Article article = new Article();
        article.setTitle(createArticleRequestDTO.getTitle());
        article.setContent(createArticleRequestDTO.getContent());
        article.setCategory(category);
        article.setAuthor(expert);
        article.setStatus(Article.ArticleStatus.PUBLISHED);
        article.setCreatedBy(expertId.toString());
        article.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        article.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        Article savedArticle = articleRepository.save(article);
        log.info("Article created successfully with ID: {}", savedArticle.getId());

        if (createArticleRequestDTO.getImageUrls() != null && !createArticleRequestDTO.getImageUrls().isEmpty()) {
            List<ArticleImage> articleImages = new ArrayList<>();
            for (String imageUrl : createArticleRequestDTO.getImageUrls()) {
                ArticleImage articleImage = ArticleImage.builder()
                        .article(savedArticle)
                        .imageUrl(imageUrl)
                        .build();
                articleImages.add(articleImage);
            }
            articleImageRepository.saveAll(articleImages);
            log.info("Saved {} images for article ID: {}", articleImages.size(), savedArticle.getId());
        }
        
        return savedArticle.getId();
    }
}