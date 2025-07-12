package com.plantcare_backend.repository;

import com.plantcare_backend.model.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    // Tìm tất cả ticket của một user
    List<SupportTicket> findByUser_IdOrderByCreatedAtDesc(int userId);

    // Tìm ticket theo status
    Page<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicket.TicketStatus status, Pageable pageable);

    // Tìm tất cả ticket với phân trang
    Page<SupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
