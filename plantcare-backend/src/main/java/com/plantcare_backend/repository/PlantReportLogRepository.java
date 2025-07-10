package com.plantcare_backend.repository;

import com.plantcare_backend.model.PlantReportLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantReportLogRepository extends JpaRepository<PlantReportLog, Long> {
    List<PlantReportLog> findByReport_ReportId(Long reportId);
}
