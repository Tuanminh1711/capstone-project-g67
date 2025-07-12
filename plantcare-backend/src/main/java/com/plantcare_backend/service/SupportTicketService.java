package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.ticket_support.ClaimTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.CreateTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.HandleTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.UpdateTicketStatusRequestDTO;
import com.plantcare_backend.dto.response.ticket_support.CreateTicketResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketListResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketResponseDTO;
import com.plantcare_backend.model.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SupportTicketService {
    //user method
    Long createTicket(CreateTicketRequestDTO request, int userId);

    List<TicketListResponseDTO> getUserTickets(int userId);

    TicketResponseDTO getTicketDetail(Long ticketId, int userId);

    void addResponse(Long ticketId, CreateTicketResponseDTO request, int userId);

    //admin method
    Page<TicketListResponseDTO> getAllTickets(Pageable pageable);

    Page<TicketListResponseDTO> getTicketsByStatus(SupportTicket.TicketStatus status, Pageable pageable);

    TicketResponseDTO getTicketDetailForAdmin(Long ticketId);

    void updateTicketStatus(Long ticketId, UpdateTicketStatusRequestDTO request);

    void addAdminResponse(Long ticketId, CreateTicketResponseDTO request, int adminId);

    // Admin Claim/Handle methods
    void claimTicket(Long ticketId, ClaimTicketRequestDTO request, int adminId);

    void handleTicket(Long ticketId, HandleTicketRequestDTO request, int adminId);

    void releaseTicket(Long ticketId, int adminId);
}
