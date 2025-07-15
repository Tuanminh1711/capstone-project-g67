package com.plantcare_backend.controller.ticket_support;

import com.plantcare_backend.dto.request.ticket_support.ClaimTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.HandleTicketRequestDTO;
import com.plantcare_backend.dto.request.ticket_support.UpdateTicketStatusRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.ticket_support.CreateTicketResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketListResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketResponseDTO;
import com.plantcare_backend.model.SupportTicket;
import com.plantcare_backend.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/support")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Support Ticket", description = "APIs for admin to manage support tickets")
@CrossOrigin(origins = "http://localhost:4200/")
public class AdminSupportTicketController {

    private final SupportTicketService supportTicketService;

    @Operation(summary = "Get all tickets", description = "Admin gets all support tickets with pagination")
    @GetMapping("/tickets")
    public ResponseData<Page<TicketListResponseDTO>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Admin requesting all tickets, page: {}, size: {}", page, size);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TicketListResponseDTO> tickets = supportTicketService.getAllTickets(pageable);
            return new ResponseData<>(HttpStatus.OK.value(), "Get all tickets successfully", tickets);
        } catch (Exception e) {
            log.error("Get all tickets failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get tickets failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Get tickets by status", description = "Admin gets tickets filtered by status")
    @GetMapping("/tickets/status/{status}")
    public ResponseData<Page<TicketListResponseDTO>> getTicketsByStatus(
            @PathVariable SupportTicket.TicketStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Admin requesting tickets with status: {}, page: {}, size: {}", status, page, size);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TicketListResponseDTO> tickets = supportTicketService.getTicketsByStatus(status, pageable);
            return new ResponseData<>(HttpStatus.OK.value(), "Get tickets by status successfully", tickets);
        } catch (Exception e) {
            log.error("Get tickets by status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get tickets failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Get ticket detail", description = "Admin gets detailed information of a ticket")
    @GetMapping("/tickets/{ticketId}")
    public ResponseData<TicketResponseDTO> getTicketDetail(@PathVariable Long ticketId) {
        log.info("Admin requesting ticket detail: {}", ticketId);

        try {
            TicketResponseDTO ticket = supportTicketService.getTicketDetailForAdmin(ticketId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get ticket detail successfully", ticket);
        } catch (Exception e) {
            log.error("Get ticket detail failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get ticket detail failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Update ticket status", description = "Admin updates the status of a ticket")
    @PutMapping("/tickets/{ticketId}/status")
    public ResponseData<?> updateTicketStatus(
            @PathVariable Long ticketId,
            @Valid @RequestBody UpdateTicketStatusRequestDTO request) {
        log.info("Admin updating ticket {} status to: {}", ticketId, request.getStatus());

        try {
            supportTicketService.updateTicketStatus(ticketId, request);
            return new ResponseData<>(HttpStatus.OK.value(), "Ticket status updated successfully");
        } catch (Exception e) {
            log.error("Update ticket status failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Update status failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Add admin response", description = "Admin adds a response to a ticket")
    @PostMapping("/tickets/{ticketId}/responses")
    public ResponseData<?> addAdminResponse(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateTicketResponseDTO request,
            @RequestAttribute("userId") int adminId) {
        log.info("Admin {} adding response to ticket: {}", adminId, ticketId);

        try {
            supportTicketService.addAdminResponse(ticketId, request, adminId);
            return new ResponseData<>(HttpStatus.OK.value(), "Admin response added successfully");
        } catch (Exception e) {
            log.error("Add admin response failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add response failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Claim ticket", description = "Admin claims a ticket to handle")
    @PostMapping("/tickets/{ticketId}/claim")
    public ResponseData<?> claimTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody ClaimTicketRequestDTO request,
            @RequestAttribute("userId") int adminId) {
        log.info("Admin {} claiming ticket: {}", adminId, ticketId);

        try {
            supportTicketService.claimTicket(ticketId, request, adminId);
            return new ResponseData<>(HttpStatus.OK.value(), "Ticket claimed successfully");
        } catch (Exception e) {
            log.error("Claim ticket failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Claim ticket failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Handle ticket", description = "Admin handles a claimed ticket")
    @PostMapping("/tickets/{ticketId}/handle")
    public ResponseData<?> handleTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody HandleTicketRequestDTO request,
            @RequestAttribute("userId") int adminId) {
        log.info("Admin {} handling ticket: {}", adminId, ticketId);

        try {
            supportTicketService.handleTicket(ticketId, request, adminId);
            return new ResponseData<>(HttpStatus.OK.value(), "Ticket handled successfully");
        } catch (Exception e) {
            log.error("Handle ticket failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Handle ticket failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Release ticket", description = "Admin releases a claimed ticket back to open status")
    @PostMapping("/tickets/{ticketId}/release")
    public ResponseData<?> releaseTicket(
            @PathVariable Long ticketId,
            @RequestAttribute("userId") int adminId) {
        log.info("Admin {} releasing ticket: {}", adminId, ticketId);

        try {
            supportTicketService.releaseTicket(ticketId, adminId);
            return new ResponseData<>(HttpStatus.OK.value(), "Ticket released successfully");
        } catch (Exception e) {
            log.error("Release ticket failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Release ticket failed: " + e.getMessage());
        }
    }
}
