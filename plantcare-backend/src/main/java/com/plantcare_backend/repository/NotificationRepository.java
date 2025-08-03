package com.plantcare_backend.repository;

import com.plantcare_backend.model.Notification;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    /**
     * Tìm tất cả notification của user, sắp xếp theo thời gian tạo mới nhất
     */
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Tìm tất cả notification chưa đọc của user
     */
    List<Notification> findByUser_IdAndStatusOrderByCreatedAtDesc(Long userId, Notification.NotificationStatus status);

    /**
     * Đếm số notification chưa đọc của user
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.status = 'UNREAD'")
    Long countUnreadByUserId(@Param("userId") Long userId);

    /**
     * Tìm notification theo user và status, có phân trang
     */
    Page<Notification> findByUser_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            Notification.NotificationStatus status,
            Pageable pageable
    );

    /**
     * Xóa tất cả notification đã đọc của user (tuỳ chọn)
     */
    void deleteByUser_IdAndStatus(Long userId, Notification.NotificationStatus status);
}
