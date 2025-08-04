package com.plantcare_backend.repository;

import com.plantcare_backend.model.TreatmentProgress;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TreatmentProgressRepository extends JpaRepository<TreatmentProgress, Long> {
    // Tìm treatment progress theo detection
    Optional<TreatmentProgress> findByDiseaseDetectionId(Long detectionId);

    // Tìm tất cả treatment chưa hoàn thành
    List<TreatmentProgress> findByIsCompletedFalse();

    // Tìm treatment theo stage
    List<TreatmentProgress> findByCurrentStage(String currentStage);

    // Tìm treatment của user
    @Query("SELECT tp FROM TreatmentProgress tp WHERE tp.diseaseDetection.user.id = :userId")
    List<TreatmentProgress> findByUserId(@Param("userId") Long userId);

    // Tìm treatment đang active của user
    @Query("SELECT tp FROM TreatmentProgress tp WHERE tp.diseaseDetection.user.id = :userId AND tp.isCompleted = false")
    List<TreatmentProgress> findActiveTreatmentsByUserId(@Param("userId") Long userId);

    // Tìm treatment đã hoàn thành của user
    @Query("SELECT tp FROM TreatmentProgress tp WHERE tp.diseaseDetection.user.id = :userId AND tp.isCompleted = true")
    List<TreatmentProgress> findCompletedTreatmentsByUserId(@Param("userId") Long userId);

    // Tính tỷ lệ thành công trung bình
    @Query("SELECT AVG(tp.successRate) FROM TreatmentProgress tp WHERE tp.diseaseDetection.user.id = :userId AND tp.isCompleted = true")
    Double getAverageSuccessRateByUserId(@Param("userId") Long userId);

    // Đếm số treatment đã hoàn thành
    @Query("SELECT COUNT(tp) FROM TreatmentProgress tp WHERE tp.diseaseDetection.user.id = :userId AND tp.isCompleted = true")
    Long countCompletedTreatmentsByUserId(@Param("userId") Long userId);
}
