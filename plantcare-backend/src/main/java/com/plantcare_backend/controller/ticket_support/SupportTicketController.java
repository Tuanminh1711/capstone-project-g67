package com.plantcare_backend.controller.ticket_support;

import com.plantcare_backend.dto.request.ticket_support.CreateTicketRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.ticket_support.CreateTicketResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketListResponseDTO;
import com.plantcare_backend.dto.response.ticket_support.TicketResponseDTO;
import com.plantcare_backend.service.SupportTicketService;
import com.plantcare_backend.service.ActivityLogService;
import com.plantcare_backend.service.external_service.AzureStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Support Ticket", description = "APIs for user support tickets")
@CrossOrigin(origins = "http://localhost:4200/")
public class SupportTicketController {
    private final SupportTicketService supportTicketService;
    private final ActivityLogService activityLogService;

    @Autowired
    private AzureStorageService azureStorageService;

    @Operation(summary = "Create support ticket", description = "User creates a new support ticket")
    @PostMapping("/tickets")
    public ResponseData<Long> createTicket(
            @Valid @RequestBody CreateTicketRequestDTO request,
            @RequestAttribute("userId") int userId,
            HttpServletRequest httpRequest) {
        log.info("User {} creating support ticket: {}", userId, request.getTitle());

        try {
            Long ticketId = supportTicketService.createTicket(request, userId);

            // Log the activity
            activityLogService.logActivity(userId, "CREATE_SUPPORT_TICKET",
                    "Created support ticket: " + request.getTitle(), httpRequest);

            return new ResponseData<>(HttpStatus.CREATED.value(), "Ticket created successfully", ticketId);
        } catch (Exception e) {
            log.error("Create ticket failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Create ticket failed: " + e.getMessage());
        }
    }

    @Operation(summary = "Upload ticket image", description = "Upload image for support ticket")
    @PostMapping("/upload-ticket-image")
    public ResponseEntity<ResponseData<String>> uploadTicketImage(@RequestParam("image") MultipartFile image) {
        try {
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File is empty", null));
            }

            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(new ResponseData<>(400, "File must be an image", null));
            }

            if (image.getSize() > 20 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(new ResponseData<>(400, "File size must be less than 20MB", null));
            }

            String originalFilename = image.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            String path = "tickets/" + newFilename;
            String imageUrl = azureStorageService.uploadFile(image, path);

            return ResponseEntity.ok(new ResponseData<>(200, "Upload thành công", imageUrl));
        } catch (Exception e) {
            log.error("Upload ticket image failed", e);
            return ResponseEntity.internalServerError()
                    .body(new ResponseData<>(500, "Upload thất bại: " + e.getMessage(), null));
        }
    }

    @Operation(summary = "Get ticket image", description = "Display ticket image")
    @GetMapping("/ticket-images/{filename}")
    public ResponseEntity<?> getTicketImage(@PathVariable String filename) {
        try {
            String path = "tickets/" + filename;
            String azureUrl = azureStorageService.generateBlobUrl(path);

            // Redirect to Azure Blob Storage URL
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, azureUrl)
                    .build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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
            @RequestAttribute("userId") int userId,
            HttpServletRequest httpRequest) {
        log.info("User {} adding response to ticket: {}", userId, ticketId);

        try {
            supportTicketService.addResponse(ticketId, request, userId);

            // Log the activity
            activityLogService.logActivity(userId, "ADD_TICKET_RESPONSE",
                    "Added response to ticket: " + ticketId, httpRequest);

            return new ResponseData<>(HttpStatus.OK.value(), "Response added successfully");
        } catch (Exception e) {
            log.error("Add response failed", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Add response failed: " + e.getMessage());
        }
    }
}
