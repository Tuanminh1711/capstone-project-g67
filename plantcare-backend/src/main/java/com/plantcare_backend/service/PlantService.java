package com.plantcare_backend.service;

import com.plantcare_backend.dto.reponse.PlantSearchResponseDTO;
import com.plantcare_backend.dto.request.PlantSearchRequestDTO;
import com.plantcare_backend.model.PlantCategory;

import java.util.List;

public interface PlantService {
    /**
     * Tìm kiếm cây theo các tiêu chí
     * 
     * @param request DTO chứa các tiêu chí tìm kiếm
     * @return Kết quả tìm kiếm với phân trang
     */
    PlantSearchResponseDTO searchPlants(PlantSearchRequestDTO request);

    /**
     * Lấy danh sách tất cả categories
     * 
     * @return Danh sách categories
     */
    List<PlantCategory> getAllCategories();
}
