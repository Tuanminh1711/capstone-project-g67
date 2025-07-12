package com.plantcare_backend.repository;

import com.plantcare_backend.model.SupportTicketLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface SupportTicketLogRepository extends JpaRepository<SupportTicketLog, Integer> {
    List<SupportTicketLog> findByTicket_TicketIdOrderByCreatedAtAsc(Long ticketId);
}
