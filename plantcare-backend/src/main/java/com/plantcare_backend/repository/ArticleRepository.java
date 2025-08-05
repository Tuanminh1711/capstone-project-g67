package com.plantcare_backend.repository;

import com.plantcare_backend.model.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findAll();
    
    Page<Article> findByStatus(Article.ArticleStatus status, Pageable pageable);
    
    Page<Article> findByAuthorId(Long authorId, Pageable pageable);
    
    Page<Article> findByCategoryId(Long categoryId, Pageable pageable);
    
    boolean existsByTitleIgnoreCase(String title);
} 