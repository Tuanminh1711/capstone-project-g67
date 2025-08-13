package com.plantcare_backend.repository;

import com.plantcare_backend.model.ArticleImage;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleImageRepository extends JpaRepository<ArticleImage, Long> {
}