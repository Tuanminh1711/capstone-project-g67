package com.plantcare_backend.service;

import com.plantcare_backend.dto.response.ai.PlantIdentificationResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface AIPlantService {
    
    /**
     * Nhận diện cây từ ảnh
     * @param image Ảnh cần nhận diện
     * @param language Ngôn ngữ kết quả (vi, en)
     * @param maxResults Số lượng kết quả tối đa
     * @return Kết quả nhận diện cây
     */
    PlantIdentificationResponseDTO identifyPlant(MultipartFile image, String language, Integer maxResults);
    
    /**
     * Validate xem ảnh có phải là thực vật không
     * @param image Ảnh cần kiểm tra
     * @return true nếu là thực vật, false nếu không
     */
    Boolean validatePlantImage(MultipartFile image);
    
    /**
     * Tìm kiếm cây trong database dựa trên tên
     * @param plantName Tên cây (có thể là tên khoa học hoặc tên thường)
     * @return Danh sách cây phù hợp
     */
    PlantIdentificationResponseDTO searchPlantsInDatabase(String plantName);
} 