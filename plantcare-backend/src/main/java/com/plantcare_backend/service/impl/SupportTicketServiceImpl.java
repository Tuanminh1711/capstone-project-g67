package com.plantcare_backend.service.impl;

import com.plantcare_backend.dto.request.ticket_support.ClaimTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.CreateTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.HandleTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.UpdateTicketStatusRequestDTO;
import com.plantcare_backend.dto.response.ticket_support.*;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.SupportTicket;
import com.plantcare_backend.model.SupportTicketLog;
import com.plantcare_backend.model.TicketResponse;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.SupportTicketLogRepository;
import com.plantcare_backend.repository.SupportTicketRepository;
import com.plantcare_backend.repository.TicketResponseRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.AdminNotificationService;
import com.plantcare_backend.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportTicketServiceImpl implements SupportTicketService {
        private final SupportTicketRepository supportTicketRepository;
        private final TicketResponseRepository ticketResponseRepository;
        private final UserRepository userRepository;
        private final SupportTicketLogRepository supportTicketLogRepository;
        private final AdminNotificationService adminNotificationService;

        @Override
        public Long createTicket(CreateTicketRequestDTO request, int userId) {
                Users user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                SupportTicket ticket = SupportTicket.builder()
                                .user(user)
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .imageUrl(request.getImageUrl())
                                .status(SupportTicket.TicketStatus.OPEN)
                                .build();

                SupportTicket savedTicket = supportTicketRepository.save(ticket);
                adminNotificationService.notifyNewTicket(savedTicket);
                return savedTicket.getTicketId();
        }

        @Override
        public List<TicketListResponseDTO> getUserTickets(int userId) {
                List<SupportTicket> tickets = supportTicketRepository.findByUser_IdOrderByCreatedAtDesc(userId);
                return tickets.stream()
                                .map(this::convertToTicketListDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public TicketResponseDTO getTicketDetail(Long ticketId, int userId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                // Kiểm tra user có quyền xem ticket này không
                if (ticket.getUser().getId() != userId) {
                        throw new ResourceNotFoundException("Ticket not found");
                }

                return convertToTicketResponseDTO(ticket);
        }

        @Override
        public void addResponse(Long ticketId, CreateTicketResponseDTO request, int userId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                Users user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Kiểm tra user có quyền trả lời ticket này không
                if (ticket.getUser().getId() != userId) {
                        throw new ResourceNotFoundException("Ticket not found");
                }

                TicketResponse response = TicketResponse.builder()
                                .ticket(ticket)
                                .responder(user)
                                .content(request.getContent())
                                .imageUrl(request.getImageUrl())
                                .build();

                ticketResponseRepository.save(response);
        }

        @Override
        public Page<TicketListResponseDTO> getAllTickets(Pageable pageable) {
                Page<SupportTicket> tickets = supportTicketRepository.findAllByOrderByCreatedAtDesc(pageable);
                return tickets.map(this::convertToTicketListDTO);
        }

        @Override
        public Page<TicketListResponseDTO> getTicketsByStatus(SupportTicket.TicketStatus status, Pageable pageable) {
                Page<SupportTicket> tickets = supportTicketRepository.findByStatusOrderByCreatedAtDesc(status,
                                pageable);
                return tickets.map(this::convertToTicketListDTO);
        }

        @Override
        public TicketResponseDTO getTicketDetailForAdmin(Long ticketId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                return convertToTicketResponseDTO(ticket);
        }

        @Override
        public void updateTicketStatus(Long ticketId, UpdateTicketStatusRequestDTO request) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                ticket.setStatus(request.getStatus());
                supportTicketRepository.save(ticket);
        }

        @Override
        public void addAdminResponse(Long ticketId, CreateTicketResponseDTO request, int adminId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                Users admin = userRepository.findById(adminId)
                                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

                TicketResponse response = TicketResponse.builder()
                                .ticket(ticket)
                                .responder(admin)
                                .content(request.getContent())
                                .imageUrl(request.getImageUrl())
                                .build();

                ticketResponseRepository.save(response);
        }

        @Override
        public void claimTicket(Long ticketId, ClaimTicketRequestDTO request, int adminId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                Users admin = userRepository.findById(adminId)
                                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

                if (ticket.getStatus() != SupportTicket.TicketStatus.OPEN) {
                        throw new RuntimeException("Ticket cannot be claimed. Current status: " + ticket.getStatus());
                }

                // Claim ticket
                ticket.setStatus(SupportTicket.TicketStatus.CLAIMED);
                ticket.setClaimedBy(admin);
                ticket.setClaimedAt(new Timestamp(System.currentTimeMillis()));
                supportTicketRepository.save(ticket);

                SupportTicketLog log = SupportTicketLog.builder()
                                .ticket(ticket)
                                .action(SupportTicketLog.Action.CLAIM)
                                .user(admin)
                                .note(request.getNote())
                                .build();
                supportTicketLogRepository.save(log);
        }

        @Override
        public void handleTicket(Long ticketId, HandleTicketRequestDTO request, int adminId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                Users admin = userRepository.findById(adminId)
                                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

                // Kiểm tra ticket có thể handle không
                if (ticket.getStatus() != SupportTicket.TicketStatus.CLAIMED) {
                        throw new RuntimeException("Ticket cannot be handled. Current status: " + ticket.getStatus());
                }

                // Kiểm tra admin có phải người claim không
                if (ticket.getClaimedBy().getId() != adminId) {
                        throw new RuntimeException("Only the admin who claimed this ticket can handle it");
                }

                // Handle ticket
                ticket.setStatus(SupportTicket.TicketStatus.IN_PROGRESS);
                ticket.setHandledBy(admin);
                ticket.setHandledAt(new Timestamp(System.currentTimeMillis()));
                supportTicketRepository.save(ticket);

                // Tạo log
                SupportTicketLog log = SupportTicketLog.builder()
                                .ticket(ticket)
                                .action(SupportTicketLog.Action.HANDLE)
                                .user(admin)
                                .note(request.getNote())
                                .build();
                supportTicketLogRepository.save(log);
        }

        @Override
        public void releaseTicket(Long ticketId, int adminId) {
                SupportTicket ticket = supportTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

                Users admin = userRepository.findById(adminId)
                                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

                // Kiểm tra ticket có thể release không
                if (ticket.getStatus() != SupportTicket.TicketStatus.CLAIMED) {
                        throw new RuntimeException("Ticket cannot be released. Current status: " + ticket.getStatus());
                }

                // Kiểm tra admin có phải người claim không
                if (ticket.getClaimedBy().getId() != adminId) {
                        throw new RuntimeException("Only the admin who claimed this ticket can release it");
                }

                // Release ticket
                ticket.setStatus(SupportTicket.TicketStatus.OPEN);
                ticket.setClaimedBy(null);
                ticket.setClaimedAt(null);
                supportTicketRepository.save(ticket);

                // Tạo log
                SupportTicketLog log = SupportTicketLog.builder()
                                .ticket(ticket)
                                .action(SupportTicketLog.Action.RELEASE)
                                .user(admin)
                                .note("Ticket released back to open status")
                                .build();
                supportTicketLogRepository.save(log);
        }

        // Helper methods để convert entity sang DTO
        private TicketListResponseDTO convertToTicketListDTO(SupportTicket ticket) {
                List<TicketResponse> responses = ticketResponseRepository
                                .findByTicket_TicketIdOrderByCreatedAtAsc(ticket.getTicketId());

                return TicketListResponseDTO.builder()
                                .ticketId(ticket.getTicketId())
                                .title(ticket.getTitle())
                                .description(ticket.getDescription())
                                .status(ticket.getStatus())
                                .createdAt(ticket.getCreatedAt())
                                .userName(ticket.getUser().getUsername())
                                .responseCount(responses.size())
                                .build();
        }

        private TicketResponseDTO convertToTicketResponseDTO(SupportTicket ticket) {
                List<TicketResponse> responses = ticketResponseRepository
                                .findByTicket_TicketIdOrderByCreatedAtAsc(ticket.getTicketId());
                List<SupportTicketLog> logs = supportTicketLogRepository
                                .findByTicket_TicketIdOrderByCreatedAtAsc(ticket.getTicketId());

                List<TicketResponseDetailDTO> responseDTOs = responses.stream()
                                .map(this::convertToResponseDetailDTO)
                                .collect(Collectors.toList());

                List<TicketLogDTO> logDTOs = logs.stream()
                                .map(this::convertToLogDTO)
                                .collect(Collectors.toList());

                return TicketResponseDTO.builder()
                                .ticketId(ticket.getTicketId())
                                .title(ticket.getTitle())
                                .description(ticket.getDescription())
                                .imageUrl(ticket.getImageUrl())
                                .status(ticket.getStatus())
                                .createdAt(ticket.getCreatedAt())
                                .userName(ticket.getUser().getUsername())
                                .responses(responseDTOs)
                                .claimedByUserName(ticket.getClaimedBy() != null ? ticket.getClaimedBy().getUsername()
                                                : null)
                                .claimedAt(ticket.getClaimedAt())
                                .handledByUserName(ticket.getHandledBy() != null ? ticket.getHandledBy().getUsername()
                                                : null)
                                .handledAt(ticket.getHandledAt())
                                .logs(logDTOs)
                                .build();
        }

        private TicketResponseDetailDTO convertToResponseDetailDTO(TicketResponse response) {
                return TicketResponseDetailDTO.builder()
                                .responseId(response.getResponseId())
                                .content(response.getContent())
                                .imageUrl(response.getImageUrl())
                                .createdAt(response.getCreatedAt())
                                .responderName(response.getResponder().getUsername())
                                .responderRole(response.getResponder().getRole().getRoleName().toString())
                                .build();
        }

        private TicketLogDTO convertToLogDTO(SupportTicketLog log) {
                return TicketLogDTO.builder()
                                .logId(log.getLogId())
                                .action(log.getAction())
                                .userName(log.getUser().getUsername())
                                .note(log.getNote())
                                .createdAt(log.getCreatedAt())
                                .build();
        }
}
