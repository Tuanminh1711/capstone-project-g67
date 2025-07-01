package com.plantcare_backend.repository;

import com.plantcare_backend.model.Plants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantRepository extends JpaRepository<Plants, Long> {
        long count();

        Page<Plants> findAll(Pageable pageable);

        long countByStatus(Plants.PlantStatus status);

        @Query("SELECT p FROM Plants p WHERE " +
                        "(:keyword IS NULL OR p.commonName LIKE %:keyword% OR p.scientificName LIKE %:keyword%) AND " +
                        "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
                        "(:lightRequirement IS NULL OR p.lightRequirement = :lightRequirement) AND " +
                        "(:waterRequirement IS NULL OR p.waterRequirement = :waterRequirement) AND " +
                        "(:careDifficulty IS NULL OR p.careDifficulty = :careDifficulty) AND " +
                        "(:status IS NULL OR p.status = :status)")
        Page<Plants> searchPlants(
                        @Param("keyword") String keyword,
                        @Param("categoryId") Long categoryId,
                        @Param("lightRequirement") Plants.LightRequirement lightRequirement,
                        @Param("waterRequirement") Plants.WaterRequirement waterRequirement,
                        @Param("careDifficulty") Plants.CareDifficulty careDifficulty,
                        @Param("status") Plants.PlantStatus status,
                        Pageable pageable);
        boolean existsByScientificNameIgnoreCase(String scientificName);

        Optional<Plants> findById(Long id);
}
