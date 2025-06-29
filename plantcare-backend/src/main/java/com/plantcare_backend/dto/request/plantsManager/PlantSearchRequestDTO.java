package com.plantcare_backend.dto.request.plantsManager;

import lombok.Data;

@Data
public class PlantSearchRequestDTO {
    private String Keyword;
    private Long categoryId;
    private String lightRequirement;
    private String waterRequirement;
    private String careDifficulty;
    private String status;
    private Integer page = 0;
    private Integer size = 10;
}
