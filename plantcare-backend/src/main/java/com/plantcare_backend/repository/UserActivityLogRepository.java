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
        
        // Method to get user activity logs ordered by timestamp descending
        Page<UserActivityLog> findByUser_IdOrderByTimestampDesc(int userId, Pageable pageable);

        @Query("SELECT DATE(ual.timestamp) as date, COUNT(DISTINCT ual.user.id) as totalActiveUsers " +
                        "FROM UserActivityLog ual " +
                        "WHERE ual.timestamp BETWEEN :startDate AND :endDate " +
                        "GROUP BY DATE(ual.timestamp) " +
                        "ORDER BY DATE(ual.timestamp) ASC")
        List<Object[]> countActiveUsersByDate(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);


        @Query("SELECT ual FROM UserActivityLog ual " +
                        "WHERE ual.user.id = :userId " +
                        "AND (:startDate IS NULL OR ual.timestamp >= :startDate) " +
                        "AND (:endDate IS NULL OR ual.timestamp <= :endDate) " +
                        "AND (:actionType IS NULL OR ual.action = :actionType)")
        Page<UserActivityLog> findByUser_IdWithFilters(
                        @Param("userId") int userId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("actionType") String actionType,
                        Pageable pageable);

        @Query("SELECT COUNT(ual) FROM UserActivityLog ual " +
                        "WHERE ual.user.id = :userId " +
                        "AND ual.action = :actionType")
        long countByUser_IdAndAction(@Param("userId") int userId, @Param("actionType") String actionType);

        @Query("SELECT ual.action, COUNT(ual) FROM UserActivityLog ual " +
                        "WHERE ual.user.id = :userId " +
                        "GROUP BY ual.action")
        List<Object[]> getActionTypeCountsByUser(@Param("userId") int userId);

        @Query("SELECT DATE(ual.timestamp) as date, COUNT(ual) as count " +
                        "FROM UserActivityLog ual " +
                        "WHERE ual.user.id = :userId " +
                        "GROUP BY DATE(ual.timestamp) " +
                        "ORDER BY COUNT(ual) DESC " +
                        "LIMIT 1")
        List<Object[]> getMostActiveDayByUser(@Param("userId") int userId);

        long countByUser_Id(int userId);
}
