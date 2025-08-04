package com.plantcare_backend.repository;

import com.plantcare_backend.model.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    Page<Article> findAll(Pageable pageable);
    
    Page<Article> findByStatus(Article.ArticleStatus status, Pageable pageable);
    
    Page<Article> findByAuthor_Id(Integer authorId, Pageable pageable);
    
    Page<Article> findByCategory_Id(Long categoryId, Pageable pageable);
    
    boolean existsByTitleIgnoreCase(String title);
} 