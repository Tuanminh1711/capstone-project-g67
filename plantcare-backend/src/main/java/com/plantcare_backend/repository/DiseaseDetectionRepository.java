package com.plantcare_backend.repository;

import com.plantcare_backend.model.DiseaseDetection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface DiseaseDetectionRepository extends JpaRepository<DiseaseDetection, Long> {

    // Tìm tất cả detection của user, sắp xếp theo thời gian mới nhất
    List<DiseaseDetection> findByUserIdOrderByDetectedAtDesc(Long userId);

    // Tìm detection của user với phân trang
    Page<DiseaseDetection> findByUserId(Long userId, Pageable pageable);

    // Tìm detection theo user plant (đã sửa với @Query)
    @Query("SELECT d FROM DiseaseDetection d WHERE d.userPlant.userPlantId = :userPlantId ORDER BY d.detectedAt DESC")
    List<DiseaseDetection> findByUserPlantIdOrderByDetectedAtDesc(@Param("userPlantId") Long userPlantId);

    // Tìm detection theo status
    List<DiseaseDetection> findByStatus(String status);

    // Tìm detection theo severity
    List<DiseaseDetection> findBySeverity(String severity);

    // Tìm detection theo tên bệnh
    List<DiseaseDetection> findByDetectedDisease(String detectedDisease);

    // Tìm detection trong khoảng thời gian
    @Query("SELECT d FROM DiseaseDetection d WHERE d.user.id = :userId AND d.detectedAt >= :startDate")
    List<DiseaseDetection> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") Timestamp startDate);

    // Đếm detection theo status
    @Query("SELECT COUNT(d) FROM DiseaseDetection d WHERE d.user.id = :userId AND d.status = :status")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);

    // Thống kê bệnh theo user
    @Query("SELECT d.detectedDisease, COUNT(d) FROM DiseaseDetection d WHERE d.user.id = :userId GROUP BY d.detectedDisease ORDER BY COUNT(d) DESC")
    List<Object[]> getDiseaseStatsByUserId(@Param("userId") Long userId);

    // Tìm detection đã được confirm
    @Query("SELECT d FROM DiseaseDetection d WHERE d.user.id = :userId AND d.isConfirmed = true")
    List<DiseaseDetection> findConfirmedDetectionsByUserId(@Param("userId") Long userId);

    // Tìm detection nghiêm trọng
    @Query("SELECT d FROM DiseaseDetection d WHERE d.user.id = :userId AND d.severity IN ('HIGH', 'CRITICAL')")
    List<DiseaseDetection> findCriticalDetectionsByUserId(@Param("userId") Long userId);
}