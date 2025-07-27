package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.personal.PersonalActivityLogRequestDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivityLogResponseDTO;
import com.plantcare_backend.dto.response.personal.PersonalActivitySummaryResponseDTO;
import org.springframework.data.domain.Page;

/**
 * Service for managing personal activity logs
 */
public interface PersonalActivityService {

    /**
     * Get paginated personal activity logs with filters
     *
     * @param userId     ID of the user
     * @param requestDTO DTO containing filters and pagination
     * @return Page of PersonalActivityLogResponseDTO
     */
    Page<PersonalActivityLogResponseDTO> getPersonalActivityLogs(int userId, PersonalActivityLogRequestDTO requestDTO);

    /**
     * Get personal activity summary
     *
     * @param userId ID of the user
     * @return PersonalActivitySummaryResponseDTO containing summary statistics
     */
    PersonalActivitySummaryResponseDTO getPersonalActivitySummary(int userId);
}