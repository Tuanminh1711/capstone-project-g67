package com.plantcare_backend.service.impl.user;

import com.plantcare_backend.dto.response.expert.ArticleDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.ArticleResponseDTO;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.Article;
import com.plantcare_backend.model.ArticleImage;
import com.plantcare_backend.repository.ArticleRepository;
import com.plantcare_backend.service.UserViewArticleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserViewArticleServiceImpl implements UserViewArticleService {

    private final ArticleRepository articleRepository;

    @Override
    public Page<ArticleResponseDTO> getAllArticles(int page, int size) {
        // Get published articles
        Page<Article> articlePage = articleRepository.findByStatus(Article.ArticleStatus.PUBLISHED, PageRequest.of(page, size));
        
        // Process images within transaction context to avoid lazy loading issues
        List<ArticleResponseDTO> articleDTOs = new ArrayList<>();
        for (Article article : articlePage.getContent()) {
            articleDTOs.add(toDTO(article));
        }
        
        // Create a new Page with the processed DTOs
        return new PageImpl<>(
            articleDTOs, 
            articlePage.getPageable(), 
            articlePage.getTotalElements()
        );
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

        // Lấy danh sách ảnh
        List<String> imageUrls = new ArrayList<>();
        List<com.plantcare_backend.dto.response.expert.ArticleImageDetailDTO> imageDetails = new ArrayList<>();
        
        if (article.getImages() != null) {
            for (ArticleImage img : article.getImages()) {
                if (img != null && img.getImageUrl() != null) {
                    imageUrls.add(img.getImageUrl());

                    com.plantcare_backend.dto.response.expert.ArticleImageDetailDTO imageDetail = 
                        new com.plantcare_backend.dto.response.expert.ArticleImageDetailDTO();
                    imageDetail.setId(img.getId());
                    imageDetail.setImageUrl(img.getImageUrl());
                    imageDetail.setDescription(null);
                    imageDetails.add(imageDetail);
                }
            }
        }
        dto.setImageUrls(imageUrls);
        dto.setImages(imageDetails);

        return dto;
    }

    @Override
    public ArticleDetailResponseDTO toArticleDetailDTO(ArticleDetailResponseDTO fullDto) {
        ArticleDetailResponseDTO userDto = new ArticleDetailResponseDTO();
        userDto.setId(fullDto.getId());
        userDto.setTitle(fullDto.getTitle());
        userDto.setContent(fullDto.getContent());
        userDto.setCategoryName(fullDto.getCategoryName());
        userDto.setAuthorName(fullDto.getAuthorName());
        userDto.setStatus(fullDto.getStatus());
        userDto.setCreatedAt(fullDto.getCreatedAt());
        userDto.setUpdatedAt(fullDto.getUpdatedAt());
        userDto.setImageUrls(fullDto.getImageUrls());
        userDto.setImages(fullDto.getImages());
        return userDto;
    }

    private ArticleResponseDTO toDTO(Article article) {
        ArticleResponseDTO dto = new ArticleResponseDTO();
        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setCategoryName(article.getCategory() != null ? article.getCategory().getName() : null);
        dto.setContent(article.getContent());

        // Lấy tất cả ảnh của article
        List<String> imageUrls = new ArrayList<>();
        try {
            if (article.getImages() != null && !article.getImages().isEmpty()) {
                // Lấy tất cả ảnh có sẵn
                for (ArticleImage img : article.getImages()) {
                    if (img != null && img.getImageUrl() != null) {
                        imageUrls.add(img.getImageUrl());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error loading images for article {}: {}", article.getId(), e.getMessage(), e);
        }

        dto.setImageUrls(imageUrls);
        dto.setCreatedAt(article.getCreatedAt());
        return dto;
    }
}
