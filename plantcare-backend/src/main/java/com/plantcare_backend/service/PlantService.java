package com.plantcare_backend.service;

import com.plantcare_backend.dto.reponse.PlantSearchResponseDTO;
import com.plantcare_backend.dto.request.plants.CreatePlantRequestDTO;
import com.plantcare_backend.dto.request.plants.PlantSearchRequestDTO;
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

    /**
     * Tạo mới một cây trồng (chỉ dành cho Admin)
     *
     * @param request DTO chứa thông tin cây trồng cần tạo
     * @return ID của cây trồng vừa tạo
     */
    Long createPlant(CreatePlantRequestDTO request);
}

