package com.plantcare_backend.repository;

import com.plantcare_backend.model.ArticleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleImageRepository extends JpaRepository<ArticleImage, Long> {
    List<ArticleImage> findByArticleId(Long articleId);
    
    void deleteByArticleId(Long articleId);
} 