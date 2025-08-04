package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.ai_disease.DiseaseDetectionRequestDTO;
import com.plantcare_backend.dto.request.ai_disease.TreatmentProgressUpdateDTO;
import com.plantcare_backend.dto.response.ai_disease.DiseaseDetectionResultDTO;
import com.plantcare_backend.dto.response.ai_disease.DiseaseStatsDTO;
import com.plantcare_backend.dto.response.ai_disease.TreatmentGuideDTO;
import com.plantcare_backend.model.DiseaseDetection;
import com.plantcare_backend.model.PlantDisease;
import com.plantcare_backend.model.TreatmentProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AIDiseaseDetectionService {
    // Phát hiện bệnh từ hình ảnh
    DiseaseDetectionResultDTO detectDiseaseFromImage(MultipartFile image, Long userId, Long plantId);

    // Phát hiện bệnh từ triệu chứng
    DiseaseDetectionResultDTO detectDiseaseFromSymptoms(DiseaseDetectionRequestDTO request, Long userId);

    // Lấy danh sách bệnh phổ biến theo loại cây
    List<PlantDisease> getCommonDiseases(String plantType);

    // Lấy hướng dẫn điều trị cho bệnh cụ thể
    TreatmentGuideDTO getTreatmentGuide(String diseaseName);

    // Bắt đầu theo dõi tiến độ điều trị
    TreatmentProgress trackTreatmentProgress(Long detectionId);

    // Cập nhật tiến độ điều trị
    TreatmentProgress updateTreatmentProgress(Long detectionId, TreatmentProgressUpdateDTO updateDTO);

    // Hoàn thành điều trị
    TreatmentProgress completeTreatment(Long detectionId, String result, Double successRate);

    // Lấy lịch sử phát hiện bệnh
    Page<DiseaseDetection> getDetectionHistory(Long userId, Pageable pageable);

    // Lấy thống kê bệnh
    DiseaseStatsDTO getDiseaseStats(Long userId);

    // Xác nhận kết quả phát hiện (bởi expert)
    DiseaseDetection confirmDetection(Long detectionId, Boolean isConfirmed, String expertNotes);

    // Gửi cảnh báo bệnh nghiêm trọng
    void sendDiseaseAlert(Long userId, String diseaseName, String severity);

    // Phân tích xu hướng bệnh
    Object analyzeDiseaseTrends(Long userId);

    // CRUD cho PlantDisease (admin functions)
   PlantDisease getDiseaseById(Long diseaseId);
    List<PlantDisease> searchDiseases(String keyword);
    List<PlantDisease> getDiseasesByCategory(String category);
    List<PlantDisease> getDiseasesBySeverity(String severity);
}
