package com.plantcare_backend.repository;

import com.plantcare_backend.model.SupportTicketLog;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface SupportTicketLogRepository extends JpaRepository<SupportTicketLog, Integer> {
    List<SupportTicketLog> findByTicket_TicketIdOrderByCreatedAtAsc(Long ticketId);
}
