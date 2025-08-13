package com.plantcare_backend.service.impl.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.request.ai_disease.DiseaseDetectionRequestDTO;
import com.plantcare_backend.dto.response.ai_disease.*;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.*;
import com.plantcare_backend.service.AIDiseaseDetectionService;
import com.plantcare_backend.service.NotificationService;
import com.plantcare_backend.service.PlantIdService;
import com.plantcare_backend.service.SynonymService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIDiseaseDetectionServiceImpl implements AIDiseaseDetectionService {

    // ==================== DEPENDENCIES ====================
    private final PlantDiseaseRepository plantDiseaseRepository;
    private final DiseaseDetectionRepository diseaseDetectionRepository;
    private final UserRepository userRepository;
    private final UserPlantRepository userPlantsRepository;
    private final NotificationService notificationService;
    private final TreatmentGuideRepository treatmentGuideRepository;
    private final PlantIdService plantIdService;
    private final SynonymService synonymService;

    // ==================== PUBLIC METHODS (Interface Implementation)
    // ====================

    @Override
    public DiseaseDetectionResultDTO detectDiseaseFromImage(MultipartFile image, Long userId) {
        log.info("Detecting disease from image for user: {}", userId);

        validateImage(image);

        // Gọi trực tiếp Plant.id API thay vì simulate
        DiseaseDetectionResultDTO result = analyzeImageWithPlantId(image, userId);

        DiseaseDetectionResultDTO savedResult = saveDetectionResult(result, userId, "IMAGE");

        if ("CRITICAL".equals(result.getSeverity()) || "HIGH".equals(result.getSeverity())) {
            sendUrgentDiseaseAlert(userId, result.getDetectedDisease(), result.getSeverity());
        }

        return savedResult;
    }

    @Override
    public DiseaseDetectionResultDTO detectDiseaseFromSymptoms(DiseaseDetectionRequestDTO request, Long userId) {
        log.info("Detecting disease from symptoms for user: {}", userId);

        DiseaseDetectionResultDTO result = analyzeSymptoms(request, userId);

        DiseaseDetectionResultDTO savedResult = saveDetectionResult(result, userId, "SYMPTOMS");

        return savedResult;
    }

    @Override
    public List<PlantDisease> getCommonDiseases(String plantType) {
        return plantDiseaseRepository.findByPlantType(plantType);
    }

    @Override
    public TreatmentGuideDTO getTreatmentGuide(String diseaseName) {
        PlantDisease disease = plantDiseaseRepository.findByDiseaseNameAndIsActiveTrue(diseaseName)
                .orElseThrow(() -> new RuntimeException("Disease not found: " + diseaseName));

        return createTreatmentGuide(disease);
    }


    @Override
    public Page<DiseaseDetectionHistoryDTO> getDetectionHistory(Long userId, Pageable pageable) {
        Page<DiseaseDetection> detections = diseaseDetectionRepository.findByUserId(userId, pageable);

        return detections.map(detection -> DiseaseDetectionHistoryDTO.builder()
                .id(detection.getId())
                .detectedDisease(detection.getDetectedDisease())
                .confidenceScore(detection.getConfidenceScore())
                .severity(detection.getSeverity())
                .symptoms(detection.getSymptoms())
                .recommendedTreatment(detection.getRecommendedTreatment())
                .status(detection.getStatus())
                .isConfirmed(detection.getIsConfirmed())
                .expertNotes(detection.getExpertNotes())
                .detectedAt(detection.getDetectedAt())
                .treatedAt(detection.getTreatedAt())
                .treatmentResult(detection.getTreatmentResult())
                .detectionMethod(detection.getDetectionMethod())
                .aiModelVersion(detection.getAiModelVersion())
                .build());
    }


    @Override
    public PlantDisease getDiseaseById(Long diseaseId) {
        return plantDiseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new RuntimeException("Disease not found"));
    }

    @Override
    public List<PlantDisease> searchDiseases(String keyword) {
        return plantDiseaseRepository.searchByKeyword(keyword);
    }

    @Override
    public List<PlantDisease> getDiseasesByCategory(String category) {
        return plantDiseaseRepository.findByCategoryAndIsActiveTrue(category);
    }

    @Override
    public List<PlantDisease> getDiseasesBySeverity(String severity) {
        return plantDiseaseRepository.findBySeverityAndIsActiveTrue(severity);
    }

    // ==================== PRIVATE METHODS - AI DISEASE DETECTION
    // ====================

    private DiseaseDetectionResultDTO simulateDiseaseDetection(MultipartFile image, Long userId) {
        return analyzeImageWithPlantId(image, userId);
    }

    private DiseaseDetectionResultDTO analyzeImageWithPlantId(MultipartFile image, Long userId) {
        try {
            log.info("Analyzing image with Plant.id API for user: {}", userId);

            PlantIdResponse plantIdResponse = plantIdService.analyzePlantDisease(image);

            if (plantIdResponse == null || plantIdResponse.getResults() == null
                    || plantIdResponse.getResults().isEmpty()) {
                log.warn("No results from Plant.id API - plant may be healthy or image unclear");
                return createHealthyPlantResult();
            }

            PlantIdResponse.PlantIdResult bestResult = plantIdResponse.getResults().get(0);

            // Tìm bệnh có probability cao nhất
            PlantIdResponse.PlantIdDisease bestDisease = null;
            double maxProbability = 0.0;

            if (bestResult.getDiseases() != null && !bestResult.getDiseases().isEmpty()) {
                for (PlantIdResponse.PlantIdDisease disease : bestResult.getDiseases()) {
                    if (disease.getProbability() > maxProbability) {
                        maxProbability = disease.getProbability();
                        bestDisease = disease;
                    }
                }
            }

            if (bestDisease != null && maxProbability > 0.3) { // Threshold 30% để đảm bảo độ tin cậy
                log.info("Detected disease: {} with confidence: {}%", bestDisease.getName(),
                        Math.round(maxProbability * 100));

                // Tìm thông tin bệnh trong database để có thông tin chi tiết
                Optional<PlantDisease> dbDisease = plantDiseaseRepository
                        .findByDiseaseNameAndIsActiveTrue(bestDisease.getName());

                if (dbDisease.isPresent()) {
                    PlantDisease disease = dbDisease.get();
                    return DiseaseDetectionResultDTO.builder()
                            .detectedDisease(disease.getDiseaseName())
                            .confidenceScore(maxProbability * 100) // Chuyển về phần trăm
                            .severity(disease.getSeverity())
                            .symptoms(disease.getSymptoms())
                            .recommendedTreatment(disease.getTreatment())
                            .prevention(disease.getPrevention())
                            .causes(disease.getCauses())
                            .detectionMethod("AI_PLANT_ID")
                            .aiModelVersion("2.0.0")
                            .build();
                } else {
                    // Nếu không tìm thấy trong DB, sử dụng thông tin từ API
                    return DiseaseDetectionResultDTO.builder()
                            .detectedDisease(bestDisease.getName())
                            .confidenceScore(maxProbability * 100)
                            .severity(determineSeverity(bestDisease.getName()))
                            .symptoms(bestDisease.getDescription() != null ? bestDisease.getDescription()
                                    : "Triệu chứng từ AI phân tích")
                            .recommendedTreatment(bestDisease.getTreatment() != null ? bestDisease.getTreatment()
                                    : "Cần tham khảo chuyên gia")
                            .detectionMethod("AI_PLANT_ID")
                            .aiModelVersion("2.0.0")
                            .build();
                }
            } else {
                log.info("No disease detected or confidence too low ({}%), plant appears healthy",
                        Math.round(maxProbability * 100));
                return createHealthyPlantResult();
            }

        } catch (Exception e) {
            log.error("Error analyzing image with Plant.id API: {}", e.getMessage(), e);

            // Fallback: sử dụng database để tìm bệnh phổ biến
            try {
                List<PlantDisease> commonDiseases = plantDiseaseRepository.findByIsActiveTrue();
                if (!commonDiseases.isEmpty()) {
                    PlantDisease fallbackDisease = commonDiseases.get(0);
                    return DiseaseDetectionResultDTO.builder()
                            .detectedDisease("Không thể phân tích ảnh - " + fallbackDisease.getDiseaseName())
                            .confidenceScore(25.0) // Độ tin cậy thấp
                            .severity("MEDIUM")
                            .symptoms("Vui lòng cung cấp ảnh rõ ràng hơn hoặc mô tả triệu chứng")
                            .recommendedTreatment("Liên hệ chuyên gia để được tư vấn chi tiết")
                            .detectionMethod("FALLBACK")
                            .aiModelVersion("2.0.0")
                            .build();
                }
            } catch (Exception fallbackError) {
                log.error("Fallback analysis also failed", fallbackError);
            }

            return createUnknownDiseaseResult();
        }
    }

    // ==================== PRIVATE METHODS - SYMPTOM ANALYSIS ====================

    private DiseaseDetectionResultDTO analyzeSymptoms(DiseaseDetectionRequestDTO request, Long userId) {
        try {
            String description = request.getDescription();
            if (description == null || description.trim().isEmpty()) {
                log.warn("Empty symptoms description for user: {}", userId);
                return createUnknownDiseaseResult();
            }

            log.info("Analyzing symptoms for user: {} - Description: {}", userId, description);

            // Sử dụng SynonymService để extract keywords và tính toán score
            List<String> keywords = synonymService.extractKeywords(description);
            log.debug("Extracted keywords: {}", keywords);

            if (keywords.isEmpty()) {
                log.warn("No meaningful keywords extracted from description");
                return createUnknownDiseaseResult();
            }

            List<PlantDisease> diseases = plantDiseaseRepository.findByIsActiveTrue();
            if (diseases.isEmpty()) {
                log.warn("No active diseases found in database");
                return createUnknownDiseaseResult();
            }

            PlantDisease bestMatch = null;
            double bestScore = 0.0;
            List<PlantDisease> alternativeMatches = new ArrayList<>();

            for (PlantDisease disease : diseases) {
                try {
                    double score = synonymService.calculateMatchScore(disease.getSymptoms(), keywords);
                    log.debug("Disease: {} - Score: {}", disease.getDiseaseName(), score);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = disease;
                    }

                    // Thu thập các bệnh có score cao (> 0.4) để làm alternative
                    if (score > 0.4 && score < bestScore) {
                        alternativeMatches.add(disease);
                    }
                } catch (Exception e) {
                    log.warn("Error calculating score for disease: {} - {}", disease.getDiseaseName(), e.getMessage());
                    continue;
                }
            }

            // Sắp xếp alternative matches theo score
            alternativeMatches.sort((a, b) -> {
                try {
                    double scoreA = synonymService.calculateMatchScore(a.getSymptoms(), keywords);
                    double scoreB = synonymService.calculateMatchScore(b.getSymptoms(), keywords);
                    return Double.compare(scoreB, scoreA); // Sắp xếp giảm dần
                } catch (Exception e) {
                    log.warn("Error sorting alternative matches", e);
                    return 0;
                }
            });

            // Lấy top 3 alternative matches
            List<String> alternativeDiseases = alternativeMatches.stream()
                    .limit(3)
                    .map(PlantDisease::getDiseaseName)
                    .collect(Collectors.toList());

            // Sử dụng threshold từ config
            double confidenceThreshold = 0.4; // Có thể lấy từ config sau
            if (bestMatch != null && bestScore > confidenceThreshold) {
                log.info("Best match found: {} with score: {}", bestMatch.getDiseaseName(), bestScore);

                return DiseaseDetectionResultDTO.builder()
                        .detectedDisease(bestMatch.getDiseaseName())
                        .confidenceScore(bestScore * 100) // Chuyển về phần trăm
                        .severity(bestMatch.getSeverity())
                        .symptoms(bestMatch.getSymptoms())
                        .recommendedTreatment(bestMatch.getTreatment())
                        .prevention(bestMatch.getPrevention())
                        .causes(bestMatch.getCauses())
                        .detectionMethod("SYMPTOMS")
                        .aiModelVersion("2.0.0")
                        .alternativeDiseases(alternativeDiseases)
                        .treatmentGuide(createTreatmentGuide(bestMatch))
                        .build();
            }

            log.info("No confident match found. Best score: {}, threshold: {}", bestScore, confidenceThreshold);

            // Trả về kết quả với gợi ý cải thiện
            String suggestion = "Cần thêm thông tin chi tiết về triệu chứng. ";
            if (bestScore > 0.2) {
                suggestion += "Có thể liên quan đến: "
                        + (bestMatch != null ? bestMatch.getDiseaseName() : "bệnh chưa xác định");
            } else {
                suggestion += "Vui lòng mô tả rõ hơn về: màu sắc lá, vị trí tổn thương, thời gian xuất hiện";
            }

            return DiseaseDetectionResultDTO.builder()
                    .detectedDisease("Không xác định được bệnh cụ thể")
                    .confidenceScore(bestScore * 100)
                    .severity("LOW")
                    .symptoms(suggestion)
                    .recommendedTreatment(
                            "Vui lòng cung cấp thêm thông tin về triệu chứng để có hướng dẫn điều trị chính xác")
                    .detectionMethod("SYMPTOMS")
                    .aiModelVersion("2.0.0")
                    .alternativeDiseases(alternativeDiseases)
                    .build();

        } catch (Exception e) {
            log.error("Error analyzing symptoms for user: {} - {}", userId, e.getMessage(), e);
            return createUnknownDiseaseResult();
        }
    }

    // Phương thức cũ đã được thay thế bằng SynonymService

    // ==================== PRIVATE METHODS - RESULT CREATION ====================

    private DiseaseDetectionResultDTO createUnknownDiseaseResult() {
        return DiseaseDetectionResultDTO.builder()
                .detectedDisease("Không xác định được bệnh")
                .confidenceScore(0.0)
                .severity("LOW")
                .symptoms("Không có triệu chứng rõ ràng")
                .recommendedTreatment("Vui lòng cung cấp ảnh rõ ràng hơn hoặc thử lại sau")
                .detectionMethod("AI_PLANT_ID")
                .aiModelVersion("2.0.0")
                .build();
    }

    private DiseaseDetectionResultDTO createHealthyPlantResult() {
        return DiseaseDetectionResultDTO.builder()
                .detectedDisease("Cây khỏe mạnh")
                .confidenceScore(0.9)
                .severity("LOW")
                .symptoms("Không phát hiện bệnh")
                .recommendedTreatment("Cây của bạn đang khỏe mạnh. Tiếp tục chăm sóc như bình thường")
                .detectionMethod("AI_PLANT_ID")
                .aiModelVersion("2.0.0")
                .build();
    }

    // ==================== PRIVATE METHODS - UTILITY FUNCTIONS ====================

    private String determineSeverity(String diseaseName) {
        if (diseaseName == null)
            return "LOW";

        String lowerDiseaseName = diseaseName.toLowerCase();

        // Bệnh nghiêm trọng
        if (lowerDiseaseName.contains("critical") ||
                lowerDiseaseName.contains("severe") ||
                lowerDiseaseName.contains("fatal") ||
                lowerDiseaseName.contains("deadly")) {
            return "CRITICAL";
        }

        // Bệnh cao
        if (lowerDiseaseName.contains("high") ||
                lowerDiseaseName.contains("serious") ||
                lowerDiseaseName.contains("advanced") ||
                lowerDiseaseName.contains("severe")) {
            return "HIGH";
        }

        // Bệnh trung bình
        if (lowerDiseaseName.contains("medium") ||
                lowerDiseaseName.contains("moderate") ||
                lowerDiseaseName.contains("mild")) {
            return "MEDIUM";
        }

        // Bệnh nhẹ hoặc không xác định
        return "LOW";
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        // Kiểm tra định dạng file
        String contentType = image.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new IllegalArgumentException("Chỉ chấp nhận file JPG hoặc PNG");
        }

        // Kiểm tra kích thước file (max 20MB)
        if (image.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("File quá lớn (tối đa 20MB)");
        }
    }

    // ==================== PRIVATE METHODS - DATABASE OPERATIONS
    // ====================

    private DiseaseDetectionResultDTO saveDetectionResult(DiseaseDetectionResultDTO result, Long userId, String method) {
        Users user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        DiseaseDetection detection = new DiseaseDetection();
        detection.setUser(user);
        detection.setUserPlant(null);
        detection.setDetectedDisease(result.getDetectedDisease());
        detection.setConfidenceScore(result.getConfidenceScore());
        detection.setSeverity(result.getSeverity());
        detection.setSymptoms(result.getSymptoms());
        detection.setRecommendedTreatment(result.getRecommendedTreatment());
        detection.setDetectionMethod(method);
        detection.setAiModelVersion(result.getAiModelVersion());
        detection.setStatus("DETECTED");

        DiseaseDetection savedDetection = diseaseDetectionRepository.save(detection);

        result.setDetectionId(savedDetection.getId());

        return result;
    }

    // ==================== PRIVATE METHODS - TREATMENT GUIDE ====================

    private TreatmentGuideDTO createTreatmentGuide(PlantDisease disease) {
        List<TreatmentGuide> guides = treatmentGuideRepository.findByDiseaseIdOrderByStepNumber(disease.getId());

        List<TreatmentStepDTO> steps = guides.stream()
                .map(this::mapToTreatmentStep)
                .collect(Collectors.toList());

        return TreatmentGuideDTO.builder()
                .diseaseName(disease.getDiseaseName())
                .severity(disease.getSeverity())
                .steps(steps)
                .requiredProducts(extractRequiredProducts(guides))
                .estimatedDuration(calculateEstimatedDuration(guides))
                .successRate("80-90%")
                .precautions(Arrays.asList("Đeo găng tay khi xử lý", "Tránh phun thuốc khi trời mưa"))
                .followUpSchedule("Kiểm tra sau 1 tuần")
                .expertNotes("Theo dõi chặt chẽ trong 2 tuần đầu")
                .build();
    }

    private TreatmentStepDTO mapToTreatmentStep(TreatmentGuide guide) {
        return TreatmentStepDTO.builder()
                .stepNumber(guide.getStepNumber())
                .title(guide.getTitle())
                .description(guide.getDescription())
                .duration(guide.getDuration())
                .frequency(guide.getFrequency())
                .materials(parseMaterials(guide.getMaterials()))
                .notes(guide.getNotes())
                .isCompleted(false)
                .build();
    }

    private List<String> parseMaterials(String materialsJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(materialsJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return Arrays.asList("Dụng cụ cần thiết");
        }
    }

    private List<String> extractRequiredProducts(List<TreatmentGuide> guides) {
        Set<String> products = new HashSet<>();
        for (TreatmentGuide guide : guides) {
            products.addAll(parseMaterials(guide.getMaterials()));
        }
        return new ArrayList<>(products);
    }

    private String calculateEstimatedDuration(List<TreatmentGuide> guides) {
        return "2-3 tuần";
    }

    // ==================== PRIVATE METHODS - NOTIFICATIONS ====================

    private void sendUrgentDiseaseAlert(Long userId, String diseaseName, String severity) {
        String message = String.format("⚠️ CẢNH BÁO: Phát hiện bệnh %s (Mức độ: %s). Cần xử lý ngay!", diseaseName,
                severity);
        // Tạm thời comment out nếu NotificationService chưa có method này
        // notificationService.sendNotification(userId, "URGENT_DISEASE_ALERT",
        // message);
        log.info("Urgent disease alert sent: {}", message);
    }
}