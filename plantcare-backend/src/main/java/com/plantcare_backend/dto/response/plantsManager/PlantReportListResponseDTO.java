package com.plantcare_backend.dto.response.plantsManager;

import lombok.Data;

import java.util.List;

/**
 * created by TaHoang.
 */
@Data
public class PlantReportListResponseDTO {
    private List<PlantReportResponseDTO> reports;
    private int totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
