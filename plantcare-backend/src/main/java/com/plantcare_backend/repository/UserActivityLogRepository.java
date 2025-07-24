package com.plantcare_backend.repository;

import com.plantcare_backend.model.UserActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * created by tahoang
 */
@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {
    Page<UserActivityLog> findByUser_Id(int userId, Pageable pageable);

    @Query("SELECT DATE(ual.timestamp) as date, COUNT(DISTINCT ual.user.id) as totalActiveUsers " +
            "FROM UserActivityLog ual " +
            "WHERE ual.timestamp BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(ual.timestamp) " +
            "ORDER BY DATE(ual.timestamp) ASC")
    List<Object[]> countActiveUsersByDate(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
