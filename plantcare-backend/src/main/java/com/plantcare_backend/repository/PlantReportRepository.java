package com.plantcare_backend.repository;

import com.plantcare_backend.model.PlantReport;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * Create by TaHoang.
 */
public interface PlantReportRepository extends JpaRepository<PlantReport, Long> {
    @Query("SELECT pr FROM PlantReport pr " +
            "JOIN pr.plant p " +
            "JOIN pr.reporter u " +
            "WHERE (:status IS NULL OR pr.status = :status) " +
            "AND (:plantName IS NULL OR p.commonName LIKE %:plantName%) " +
            "AND (:reporterName IS NULL OR u.username LIKE %:reporterName%) " +
            "ORDER BY pr.createdAt DESC")
    Page<PlantReport> findReportsWithFilters(
            @Param("status") PlantReport.ReportStatus status,
            @Param("plantName") String plantName,
            @Param("reporterName") String reporterName,
            Pageable pageable
    );
    int countByPlantId(Long plantId);
    // Kiểm tra user đã report plant chưa
    boolean existsByPlant_IdAndReporter_Id(Long plantId, Integer reporterId);
    // Đếm số report theo status
    int countByPlantIdAndStatusIn(Long plantId, List<PlantReport.ReportStatus> statuses);

    List<PlantReport> findByPlant_Id(Long plantId);
}
