package com.plantcare_backend.service.impl;
import com.plantcare_backend.dto.request.expert.CreateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateCategoryRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateArticleRequestDTO;
import com.plantcare_backend.dto.request.expert.ChangeArticleStatusRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdateArticleRequestDTO;
import com.plantcare_backend.dto.request.expert.ArticleImageUpdateDTO;
import com.plantcare_backend.dto.response.expert.CategoryDetailResponse;
import com.plantcare_backend.dto.response.expert.ArticleResponseDTO;
import com.plantcare_backend.dto.response.expert.ArticleDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.ArticleImageDetailDTO;
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

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

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
        article.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        article.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));

        Article savedArticle = articleRepository.save(article);
        log.info("Article created successfully with ID: {}", savedArticle.getId());

        if (createArticleRequestDTO.getImageUrls() != null && !createArticleRequestDTO.getImageUrls().isEmpty()) {
            saveArticleImages(savedArticle, createArticleRequestDTO.getImageUrls());
        }
        
        return savedArticle.getId();
    }

    private void saveArticleImages(Article article, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        List<ArticleImage> articleImages = new ArrayList<>();
        for (String imageUrl : imageUrls) {
            ArticleImage articleImage = ArticleImage.builder()
                    .article(article)
                    .imageUrl(imageUrl)
                    .build();
            articleImages.add(articleImage);
        }
        articleImageRepository.saveAll(articleImages);
        log.info("Saved {} images for article ID: {}", articleImages.size(), article.getId());
    }

    @Override
    public void changeArticleStatus(Long articleId, Article.ArticleStatus status) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article with id " + articleId + " not found"));

        // Kiểm tra xem article có phải của expert này không (optional)
        // Có thể thêm logic kiểm tra author nếu cần

        // Validation: Không cho phép chuyển từ DELETED sang status khác
        if (article.getStatus() == Article.ArticleStatus.DELETED && status != Article.ArticleStatus.DELETED) {
            throw new InvalidDataException("Cannot change status of deleted article");
        }

        article.setStatus(status);
        article.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        articleRepository.save(article);

        log.info("Article status changed from {} to {} for article ID: {}", article.getStatus(), status, articleId);
    }

    @Override
    public Page<ArticleResponseDTO> getArticlesByExpert(Long expertId, Pageable pageable) {
        Page<Article> articlesPage = articleRepository.findByAuthorId(expertId, pageable);
        
        log.info("Found {} articles for expert ID: {}", articlesPage.getTotalElements(), expertId);
        return articlesPage.map(this::convertToArticleResponseDTO);
    }

    private ArticleResponseDTO convertToArticleResponseDTO(Article article) {
        return ArticleResponseDTO.builder()
                .id(article.getId())
                .title(article.getTitle())
                .categoryName(article.getCategory() != null ? article.getCategory().getName() : null)
                .imageUrls(article.getImages() != null ? 
                    article.getImages().stream()
                        .map(img -> img.getImageUrl())
                        .toList() : null)
                .build();
    }

    @Override
    public ArticleDetailResponseDTO getArticleDetail(Long articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));

        ArticleDetailResponseDTO dto = new ArticleDetailResponseDTO();
        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setContent(article.getContent());
        dto.setCategoryName(article.getCategory() != null ? article.getCategory().getName() : null);
        dto.setAuthorName(article.getAuthor() != null ? article.getAuthor().getUsername() : null);
        dto.setStatus(article.getStatus());
        dto.setCreatedBy(article.getCreatedBy());
        dto.setCreatedAt(article.getCreatedAt());
        dto.setUpdatedAt(article.getUpdatedAt());

        List<String> imageUrls = new ArrayList<>();
        List<ArticleImageDetailDTO> imageDetails = new ArrayList<>();

        if (article.getImages() != null) {
            for (ArticleImage img : article.getImages()) {
                imageUrls.add(img.getImageUrl());

                ArticleImageDetailDTO imageDetail = new ArticleImageDetailDTO();
                imageDetail.setId(img.getId());
                imageDetail.setImageUrl(img.getImageUrl());
                imageDetail.setDescription(null); // ArticleImage không có description field
                imageDetails.add(imageDetail);
            }
        }
        dto.setImageUrls(imageUrls);
        dto.setImages(imageDetails);

        return dto;
    }

    @Override
    public ArticleDetailResponseDTO updateArticle(Long articleId, UpdateArticleRequestDTO updateRequest) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + articleId));

        ArticleCategory category = articleCategoryRepository.findById(updateRequest.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        article.setTitle(updateRequest.getTitle());
        article.setContent(updateRequest.getContent());
        article.setCategory(category);
        article.setStatus(Article.ArticleStatus.valueOf(updateRequest.getStatus()));
        article.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));

        // Cập nhật ảnh - Logic linh hoạt
        if (updateRequest.getImageUpdates() != null && !updateRequest.getImageUpdates().isEmpty()) {
            // Xử lý update ảnh linh hoạt
            handleFlexibleImageUpdates(article, updateRequest.getImageUpdates());
        } else if (updateRequest.getImageUrls() != null) {
            // Logic cũ - thay thế toàn bộ ảnh
            if (updateRequest.getImageUrls().isEmpty()) {
                article.getImages().clear();
            } else {
                article.getImages().clear();

                List<ArticleImage> newImages = updateRequest.getImageUrls().stream()
                        .map(url -> ArticleImage.builder()
                                .article(article)
                                .imageUrl(url)
                                .build())
                        .collect(Collectors.toList());

                article.getImages().addAll(newImages);
            }
        }
        // Nếu cả imageUpdates và imageUrls đều null, giữ nguyên ảnh cũ

        Article updatedArticle = articleRepository.save(article);
        return getArticleDetail(updatedArticle.getId());
    }

    private void handleFlexibleImageUpdates(Article article, List<ArticleImageUpdateDTO> imageUpdates) {
        for (ArticleImageUpdateDTO imageUpdate : imageUpdates) {
            switch (imageUpdate.getAction().toUpperCase()) {
                case "ADD":
                    if (imageUpdate.getImageUrl() != null) {
                        ArticleImage newImage = ArticleImage.builder()
                                .article(article)
                                .imageUrl(imageUpdate.getImageUrl())
                                .build();
                        article.getImages().add(newImage);
                    }
                    break;
                case "UPDATE":
                    if (imageUpdate.getImageId() != null && imageUpdate.getImageUrl() != null) {
                        article.getImages().stream()
                                .filter(img -> img.getId() != null && img.getId().equals(imageUpdate.getImageId()))
                                .findFirst()
                                .ifPresent(img -> img.setImageUrl(imageUpdate.getImageUrl()));
                    }
                    break;
                case "DELETE":
                    if (imageUpdate.getImageId() != null) {
                        article.getImages().removeIf(img -> img.getId() != null && img.getId().equals(imageUpdate.getImageId()));
                    }
                    break;
                default:
                    log.warn("Unknown image update action: {}", imageUpdate.getAction());
            }
        }
    }
}