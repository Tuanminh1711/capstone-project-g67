package com.plantcare_backend.repository;

import com.plantcare_backend.model.PlantDisease;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantDiseaseRepository extends JpaRepository<PlantDisease, Long> {
    // Tìm tất cả bệnh đang active
    List<PlantDisease> findByIsActiveTrue();

    // Tìm bệnh theo category
    List<PlantDisease> findByCategoryAndIsActiveTrue(String category);

    // Tìm bệnh theo severity
    List<PlantDisease> findBySeverityAndIsActiveTrue(String severity);

    // Tìm bệnh theo tên
    Optional<PlantDisease> findByDiseaseNameAndIsActiveTrue(String diseaseName);

    // Tìm bệnh theo loại cây bị ảnh hưởng
    @Query("SELECT p FROM PlantDisease p WHERE p.affectedPlantTypes LIKE %:plantType% AND p.isActive = true")
    List<PlantDisease> findByPlantType(@Param("plantType") String plantType);

    // Tìm kiếm bệnh theo keyword
    @Query("SELECT p FROM PlantDisease p WHERE (p.diseaseName LIKE %:keyword% OR p.symptoms LIKE %:keyword%) AND p.isActive = true")
    List<PlantDisease> searchByKeyword(@Param("keyword") String keyword);

    // Lấy tất cả categories
    @Query("SELECT DISTINCT p.category FROM PlantDisease p WHERE p.isActive = true")
    List<String> findAllCategories();

    // Lấy tất cả severities
    @Query("SELECT DISTINCT p.severity FROM PlantDisease p WHERE p.isActive = true")
    List<String> findAllSeverities();
}
