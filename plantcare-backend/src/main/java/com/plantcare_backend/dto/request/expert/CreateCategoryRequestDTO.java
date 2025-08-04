package com.plantcare_backend.dto.request.expert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequestDTO {
    @NotBlank(message = "categoryName must not blank")
    private String name;
    @NotBlank(message = "description must not blank")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
