package com.plantcare_backend.dto.reponse.Plants;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * created by tahoang
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantSearchResponseDTO {
    private List<PlantResponseDTO> plants;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
