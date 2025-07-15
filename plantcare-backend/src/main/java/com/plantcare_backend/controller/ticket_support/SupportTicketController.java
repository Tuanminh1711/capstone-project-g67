package com.plantcare_backend.controller.ticket_support;

import com.plantcare_backend.dto.request.ticket_support.CreateTicketRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.ticket_support.CreateTicketResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketListResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketResponseDTO;
import com.plantcare_backend.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Support Ticket", description = "APIs for user support tickets")
@CrossOrigin(origins = "http://localhost:4200/")
public class SupportTicketController {
    private final SupportTicketService supportTicketService;

    @Operation(summary = "Create support ticket", description = "User creates a new support ticket")
    @PostMapping("/tickets")
    public ResponseData<Long> createTicket(
            @Valid @RequestBody CreateTicketRequestDTO request,
            @RequestAttribute("userId") int userId) {
        log.info("User {} creating support ticket: {}", userId, request.getTitle());

        try {
            Long ticketId = supportTicketService.createTicket(request, userId);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Ticket created successfully", ticketId);
        } catch (Exception e) {
            log.error("Create ticket failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Create ticket failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Get user tickets", description = "Get all tickets created by the current user")
    @GetMapping("/tickets")
    public ResponseData<List<TicketListResponseDTO>> getUserTickets(@RequestAttribute("userId") int userId) {
        log.info("User {} requesting their tickets", userId);

        try {
            List<TicketListResponseDTO> tickets = supportTicketService.getUserTickets(userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get tickets successfully", tickets);
        } catch (Exception e) {
            log.error("Get user tickets failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get tickets failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Get ticket detail", description = "Get detailed information of a specific ticket")
    @GetMapping("/tickets/{ticketId}")
    public ResponseData<TicketResponseDTO> getTicketDetail(
            @PathVariable Long ticketId,
            @RequestAttribute("userId") int userId) {
        log.info("User {} requesting ticket detail: {}", userId, ticketId);

        try {
            TicketResponseDTO ticket = supportTicketService.getTicketDetail(ticketId, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Get ticket detail successfully", ticket);
        } catch (Exception e) {
            log.error("Get ticket detail failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Get ticket detail failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Add response to ticket", description = "User adds a response to their ticket")
    @PostMapping("/tickets/{ticketId}/responses")
    public ResponseData<?> addResponse(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateTicketResponseDTO request,
            @RequestAttribute("userId") int userId) {
        log.info("User {} adding response to ticket: {}", userId, ticketId);

        try {
            supportTicketService.addResponse(ticketId, request, userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Response added successfully");
        } catch (Exception e) {
            log.error("Add response failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add response failed: " + e.getMessage());
        }
    }
}
