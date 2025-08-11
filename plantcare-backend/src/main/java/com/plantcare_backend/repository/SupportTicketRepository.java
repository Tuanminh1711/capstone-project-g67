package com.plantcare_backend.repository;

import com.plantcare_backend.model.SupportTicket;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    // Tìm tất cả ticket của một user
    List<SupportTicket> findByUser_IdOrderByCreatedAtDesc(int userId);

    // Tìm ticket theo status
    Page<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicket.TicketStatus status, Pageable pageable);

    // Tìm tất cả ticket với phân trang
    Page<SupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Query("UPDATE SupportTicket t SET t.status = 'CLAIMED', t.claimedBy.id = :adminId, " +
            "t.claimedAt = :claimedAt WHERE t.ticketId = :ticketId AND t.status = 'OPEN' " +
            "AND t.claimedBy IS NULL")
    int claimTicketAtomic(@Param("ticketId") Long ticketId,
                          @Param("adminId") int adminId,
                          @Param("claimedAt") Timestamp claimedAt);
}
