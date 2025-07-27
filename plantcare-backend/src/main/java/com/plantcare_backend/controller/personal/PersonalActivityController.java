package com.plantcare_backend.controller.personal;

import com.plantcare_backend.dto.request.personal.PersonalActivityLogRequestDTO;
import com.plantcare_backend.dto.response.base.ResponseData;
import com.plantcare_backend.dto.response.base.ResponseError;
import com.plantcare_backend.dto.response.personal.PersonalActivityLogResponseDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivitySummaryResponseDTO;

import com.plantcare_backend.service.PersonalActivityService;
import com.plantcare_backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


/**
 * Controller for personal activity logs
 */
@RestController
@RequestMapping("/api/personal")
@Slf4j
@Tag(name = "Personal Activity Controller")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200/")
public class PersonalActivityController {

    private final PersonalActivityService personalActivityService;
    private final JwtUtil jwtUtil;

    /**
     * Get personal activity logs with filters and pagination
     *
     * @param requestDTO DTO containing filters and pagination
     * @return Page of PersonalActivityLogResponseDTO
     */
    @Operation(method = "POST", summary = "Get personal activity logs", description = "Get paginated personal activity logs with filters")
    @PostMapping("/activity-logs")
    public ResponseData<Page<PersonalActivityLogResponseDTO>> getPersonalActivityLogs(
            @Valid @RequestBody PersonalActivityLogRequestDTO requestDTO,
            HttpServletRequest request) {

        String token = extractTokenFromRequest(request);
        int userId = jwtUtil.getUserIdFromToken(token).intValue();
        String username = jwtUtil.getUsernameFromToken(token);

        log.info("User {} requesting personal activity logs", username);

        try {
            Page<PersonalActivityLogResponseDTO> activityLogs = personalActivityService.getPersonalActivityLogs(userId,
                    requestDTO);
            return new ResponseData<>(HttpStatus.OK.value(), "Personal activity logs retrieved successfully",
                    activityLogs);
        } catch (Exception e) {
            log.error("Failed to get personal activity logs for user: {}", username, e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get personal activity logs: " + e.getMessage());
        }
    }

    /**
     * Get personal activity summary
     *
     * @return PersonalActivitySummaryResponseDTO containing summary statistics
     */
    @Operation(method = "GET", summary = "Get personal activity summary", description = "Get summary statistics of personal activities")
    @GetMapping("/activity-logs/summary")
    public ResponseData<PersonalActivitySummaryResponseDTO> getPersonalActivitySummary(HttpServletRequest request) {

        // Get current user ID from JWT token
        String token = extractTokenFromRequest(request);
        int userId = jwtUtil.getUserIdFromToken(token).intValue();
        String username = jwtUtil.getUsernameFromToken(token);

        log.info("User {} requesting personal activity summary", username);

        try {
            PersonalActivitySummaryResponseDTO summary = personalActivityService.getPersonalActivitySummary(userId);
            return new ResponseData<>(HttpStatus.OK.value(), "Personal activity summary retrieved successfully",
                    summary);
        } catch (Exception e) {
            log.error("Failed to get personal activity summary for user: {}", username, e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(),
                    "Failed to get personal activity summary: " + e.getMessage());
        }
    }

    /**
     * Extract token from request header
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        throw new RuntimeException("Authorization header not found or invalid");
    }


}