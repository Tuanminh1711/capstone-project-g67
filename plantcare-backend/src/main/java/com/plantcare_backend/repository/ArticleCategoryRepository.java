package com.plantcare_backend.repository;

import com.plantcare_backend.model.ArticleCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, Long> {
    List<ArticleCategory> findAll();

    Page<ArticleCategory> findByStatus(ArticleCategory.CategoryStatus status, Pageable pageable);

    boolean existsByNameAndStatus(String name, ArticleCategory.CategoryStatus status);
}
