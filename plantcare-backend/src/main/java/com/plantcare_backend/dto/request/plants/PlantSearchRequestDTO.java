package com.plantcare_backend.dto.request.plants;

import com.plantcare_backend.model.Plants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantSearchRequestDTO {
    private String keyword;
    private Long categoryId;
    private Plants.LightRequirement lightRequirement;
    private Plants.WaterRequirement waterRequirement;
    private Plants.CareDifficulty careDifficulty;
    private Plants.PlantStatus status;

    @Min(value = 0, message = "Page number cannot be negative")
    private int pageNo = 0;

    @Min(value = 1, message = "Page size must be greater than 0")
    @Max(value = 100, message = "Page size must not be greater than 100")
    private int pageSize = 10;

    private String sortBy = "commonName";
    private String sortDirection = "ASC";
}
