package com.plantcare_backend.repository;

import com.plantcare_backend.model.Plants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantRepository extends JpaRepository<Plants, Long> {
        long count();

        Page<Plants> findAll(Pageable pageable);

        long countByStatus(Plants.PlantStatus status);

        // Tìm kiếm theo tên thường hoặc tên khoa học
        Page<Plants> findByCommonNameContainingIgnoreCaseOrScientificNameContainingIgnoreCase(
                        String commonName, String scientificName, Pageable pageable);

        // Tìm kiếm theo category và keyword
        Page<Plants> findByCategoryIdAndCommonNameContainingIgnoreCase(
                        Long categoryId, String keyword, Pageable pageable);

        // Tìm kiếm theo các tiêu chí bộ lọc
        Page<Plants> findByLightRequirementAndWaterRequirementAndCareDifficulty(
                        Plants.LightRequirement lightRequirement,
                        Plants.WaterRequirement waterRequirement,
                        Plants.CareDifficulty careDifficulty,
                        Pageable pageable);

        // Method tổng hợp tìm kiếm với tất cả tiêu chí
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
}
