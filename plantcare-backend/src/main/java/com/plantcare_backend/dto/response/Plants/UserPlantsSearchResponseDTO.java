package com.plantcare_backend.dto.response.Plants;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPlantsSearchResponseDTO {
    private List<UserPlantsResponseDTO> userPlants;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
} 