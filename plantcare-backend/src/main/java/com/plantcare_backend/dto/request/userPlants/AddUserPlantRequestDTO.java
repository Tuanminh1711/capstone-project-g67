package com.plantcare_backend.dto.request.userPlants;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import java.util.List;


@Data
public class AddUserPlantRequestDTO {
    @NotNull(message = "Plant ID is required")
    private Long plantId;

    @NotBlank(message = "Nickname is required")
    private String nickname;

    @NotNull(message = "Planting date is required")
    private String plantingDate;

    private String locationInHouse;
    private boolean reminderEnabled;
    private List<MultipartFile> images; // Thêm field images
}
