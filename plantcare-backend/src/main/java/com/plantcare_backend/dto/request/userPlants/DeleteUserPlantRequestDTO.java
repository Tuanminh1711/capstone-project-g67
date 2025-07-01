package com.plantcare_backend.dto.request.userPlants;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeleteUserPlantRequestDTO {
    
    @NotNull(message = "User plant ID is required")
    private Long userPlantId;
} 