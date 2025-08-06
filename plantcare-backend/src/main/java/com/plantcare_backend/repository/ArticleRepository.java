package com.plantcare_backend.repository;

import com.plantcare_backend.model.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findAll();
    
    Page<Article> findByStatus(Article.ArticleStatus status, Pageable pageable);
    
    Page<Article> findByAuthorId(Long authorId, Pageable pageable);
    
    Page<Article> findByCategoryId(Long categoryId, Pageable pageable);
    
    @Query("SELECT COUNT(a) > 0 FROM Article a WHERE LOWER(a.title) = LOWER(:title)")
    boolean existsByTitleIgnoreCase(@Param("title") String title);
} 