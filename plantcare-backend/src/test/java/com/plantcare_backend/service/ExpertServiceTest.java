package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.expert.CreateArticleRequestDTO;
import com.plantcare_backend.model.Article;
import com.plantcare_backend.model.ArticleCategory;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.ArticleCategoryRepository;
import com.plantcare_backend.repository.ArticleRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.impl.ExpertServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpertServiceTest {

    @Mock
    private ArticleCategoryRepository articleCategoryRepository;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpertServiceImpl expertService;

    @Test
    public void testCreateArticle_Success() {
        // Arrange
        CreateArticleRequestDTO request = new CreateArticleRequestDTO();
        request.setTitle("Test Article");
        request.setContent("Test content");
        request.setCategoryId("1");
        request.setImageUrls(Arrays.asList("/api/expert/articles/test.jpg"));

        ArticleCategory category = new ArticleCategory();
        category.setId(1L);
        category.setName("Test Category");
        category.setStatus(ArticleCategory.CategoryStatus.ACTIVE);

        Users expert = new Users();
        expert.setId(1);

        Article savedArticle = new Article();
        savedArticle.setId(1L);
        savedArticle.setTitle("Test Article");

        when(articleCategoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(articleRepository.existsByTitleIgnoreCase("Test Article")).thenReturn(false);
        when(userRepository.findById(1)).thenReturn(Optional.of(expert));
        when(articleRepository.save(any(Article.class))).thenReturn(savedArticle);

        // Act
        Long result = expertService.createArticleByExpert(request, 1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result);
        verify(articleCategoryRepository).findById(1L);
        verify(articleRepository).existsByTitleIgnoreCase("Test Article");
        verify(userRepository).findById(1);
        verify(articleRepository).save(any(Article.class));
    }
} 