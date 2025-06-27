package com.plantcare_backend.dto.request.userPlants;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPlantsSearchRequestDTO {
    private String keywordOfCommonName;
    private Long userId;

    @Min(value = 0, message = "Page number cannot be negative")
    private int pageNo = 0;

    @Min(value = 1, message = "Page size must be greater than 0")
    @Max(value = 100, message = "Page size must not be greater than 100")
    private int pageSize = 10;

    private String sortBy = "plantName";
    private String sortDirection = "ASC";
}