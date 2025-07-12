package com.plantcare_backend.repository;

import com.plantcare_backend.model.TicketResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketResponseRepository extends JpaRepository<TicketResponse, Long> {
    List<TicketResponse> findByTicket_TicketIdOrderByCreatedAtAsc(Long ticketId);
}
