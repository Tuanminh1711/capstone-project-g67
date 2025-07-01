package com.plantcare_backend.dto.request.plantsManager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePlantRequestDTO {
    @NotBlank(message = "Scientific name must not be blank")
    private String scientificName;

    @NotBlank(message = "Common name must not be blank")
    private String commonName;

    @NotNull(message = "Category ID must not be null")
    private Long categoryId;

    private String description;
    private String careInstructions;

    @NotBlank(message = "Light requirement must not be blank")
    private String lightRequirement; // LOW, MEDIUM, HIGH

    @NotBlank(message = "Water requirement must not be blank")
    private String waterRequirement; // LOW, MEDIUM, HIGH

    @NotBlank(message = "Care difficulty must not be blank")
    private String careDifficulty; // EASY, MODERATE, DIFFICULT

    private String suitableLocation;
    private String commonDiseases;

    @NotBlank(message = "Status must not be blank")
    private String status; // ACTIVE, INACTIVE

    private List<String> imageUrls; // Danh sách ảnh mới (nếu muốn thay thế toàn bộ)

    // Thêm field mới cho update ảnh linh hoạt
    private List<PlantImageUpdateDTO> imageUpdates; // Cho phép update từng ảnh cụ thể
}
