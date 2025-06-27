package com.plantcare_backend.repository;

import com.plantcare_backend.model.PlantCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantCategoryRepository extends JpaRepository<PlantCategory, Long> {
    List<PlantCategory> findAll();
}
