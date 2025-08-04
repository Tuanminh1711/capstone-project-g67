package com.plantcare_backend.dto.response.Plants;

import lombok.Data;

import java.util.List;

@Data
public class UserReportListResponseDTO {
    private List<UserReportResponseDTO> reports;
    private int totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
