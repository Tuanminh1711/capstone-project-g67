package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.ai_disease.DiseaseDetectionRequestDTO;
import com.plantcare_backend.dto.response.ai_disease.*;
import com.plantcare_backend.model.DiseaseDetection;
import com.plantcare_backend.model.PlantDisease;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AIDiseaseDetectionService {
    // Phát hiện bệnh từ hình ảnh
    DiseaseDetectionResultDTO detectDiseaseFromImage(MultipartFile image, Long userId);

    // Phát hiện bệnh từ triệu chứng
    DiseaseDetectionResultDTO detectDiseaseFromSymptoms(DiseaseDetectionRequestDTO request, Long userId);

    // Lấy danh sách bệnh phổ biến theo loại cây
    List<PlantDisease> getCommonDiseases(String plantType);

    // Lấy hướng dẫn điều trị cho bệnh cụ thể
    TreatmentGuideDTO getTreatmentGuide(String diseaseName);

    // Lấy lịch sử phát hiện bệnh
    Page<DiseaseDetectionHistoryDTO> getDetectionHistory(Long userId, Pageable pageable);

    // CRUD cho PlantDisease (admin functions)
    PlantDisease getDiseaseById(Long diseaseId);

    List<PlantDisease> searchDiseases(String keyword);

    List<PlantDisease> getDiseasesByCategory(String category);

    List<PlantDisease> getDiseasesBySeverity(String severity);
}
