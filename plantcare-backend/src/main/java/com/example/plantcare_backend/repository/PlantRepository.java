package com.example.plantcare_backend.repository;

import com.example.plantcare_backend.model.Plants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantRepository extends JpaRepository<Plants, Long> {
    long count();
    Page<Plants> findAll(Pageable pageable);
    long countByStatus(Plants.PlantStatus status);
}
