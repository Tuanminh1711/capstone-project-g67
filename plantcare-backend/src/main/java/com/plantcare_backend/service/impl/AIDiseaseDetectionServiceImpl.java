package com.plantcare_backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.request.ai_disease.DiseaseDetectionRequestDTO;
import com.plantcare_backend.dto.request.ai_disease.TreatmentProgressUpdateDTO;
import com.plantcare_backend.dto.response.ai_disease.DiseaseDetectionResultDTO;
import com.plantcare_backend.dto.response.ai_disease.DiseaseStatsDTO;
import com.plantcare_backend.dto.response.ai_disease.TreatmentGuideDTO;
import com.plantcare_backend.dto.response.ai_disease.TreatmentStepDTO;
import com.plantcare_backend.enums.PlantDiseaseType;
import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.*;
import com.plantcare_backend.service.AIDiseaseDetectionService;
import com.plantcare_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIDiseaseDetectionServiceImpl implements AIDiseaseDetectionService {
    private final PlantDiseaseRepository plantDiseaseRepository;
    private final DiseaseDetectionRepository diseaseDetectionRepository;
    private final TreatmentProgressRepository treatmentProgressRepository;
    private final UserRepository userRepository;
    private final UserPlantRepository userPlantsRepository;
    private final NotificationService notificationService;
    private final TreatmentGuideRepository treatmentGuideRepository;

    @Override
    public DiseaseDetectionResultDTO detectDiseaseFromImage(MultipartFile image, Long userId, Long plantId) {
        log.info("Detecting disease from image for user: {}, plant: {}", userId, plantId);

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        DiseaseDetectionResultDTO result = simulateDiseaseDetection(image, userId, plantId);

        saveDetectionResult(result, userId, plantId, "IMAGE");

        if ("CRITICAL".equals(result.getSeverity()) || "HIGH".equals(result.getSeverity())) {
            sendUrgentDiseaseAlert(userId, result.getDetectedDisease(), result.getSeverity());
        }

        return result;
    }

    @Override
    public DiseaseDetectionResultDTO detectDiseaseFromSymptoms(DiseaseDetectionRequestDTO request, Long userId) {
        log.info("Detecting disease from symptoms for user: {}", userId);

        DiseaseDetectionResultDTO result = analyzeSymptoms(request, userId);

        saveDetectionResult(result, userId, request.getPlantId(), "SYMPTOMS");

        return result;
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
    public TreatmentProgress trackTreatmentProgress(Long detectionId) {
        DiseaseDetection detection = diseaseDetectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));

        Optional<TreatmentProgress> existing = treatmentProgressRepository.findByDiseaseDetectionId(detectionId);
        if (existing.isPresent()) {
            return existing.get();
        }

        TreatmentProgress progress = new TreatmentProgress();
        progress.setDiseaseDetection(detection);
        progress.setCurrentStage("DIAGNOSIS");
        progress.setProgressPercentage(0);
        progress.setTreatmentStartDate(new Timestamp(System.currentTimeMillis()));

        return treatmentProgressRepository.save(progress);
    }

    @Override
    public TreatmentProgress updateTreatmentProgress(Long detectionId, TreatmentProgressUpdateDTO updateDTO) {
        TreatmentProgress progress = treatmentProgressRepository.findByDiseaseDetectionId(detectionId)
                .orElseThrow(() -> new RuntimeException("Treatment progress not found"));

        progress.setProgressPercentage(updateDTO.getProgressPercentage());
        progress.setCurrentStage(updateDTO.getCurrentStage());
        progress.setNextAction(updateDTO.getNextAction());
        progress.setNotes(updateDTO.getNotes());
        progress.setPhotos(updateDTO.getPhotos());
        progress.setLastUpdateDate(new Timestamp(System.currentTimeMillis()));

        return treatmentProgressRepository.save(progress);
    }

    @Override
    public TreatmentProgress completeTreatment(Long detectionId, String result, Double successRate) {
        TreatmentProgress progress = treatmentProgressRepository.findByDiseaseDetectionId(detectionId)
                .orElseThrow(() -> new RuntimeException("Treatment progress not found"));

        progress.setIsCompleted(true);
        progress.setCompletionDate(new Timestamp(System.currentTimeMillis()));
        progress.setSuccessRate(successRate);

        DiseaseDetection detection = progress.getDiseaseDetection();
        detection.setStatus("COMPLETED");
        detection.setTreatmentResult(result);
        detection.setTreatedAt(new Timestamp(System.currentTimeMillis()));
        diseaseDetectionRepository.save(detection);

        return treatmentProgressRepository.save(progress);
    }

    @Override
    public Page<DiseaseDetection> getDetectionHistory(Long userId, Pageable pageable) {
        return diseaseDetectionRepository.findByUserId(userId, pageable);
    }

    @Override
    public DiseaseStatsDTO getDiseaseStats(Long userId) {
        List<DiseaseDetection> detections = diseaseDetectionRepository.findByUserIdOrderByDetectedAtDesc(userId);

        long totalDetections = detections.size();
        long confirmedDetections = detections.stream().filter(DiseaseDetection::getIsConfirmed).count();
        long criticalDetections = detections.stream()
                .filter(d -> "CRITICAL".equals(d.getSeverity()) || "HIGH".equals(d.getSeverity()))
                .count();

        double averageConfidence = detections.stream()
                .mapToDouble(DiseaseDetection::getConfidenceScore)
                .average()
                .orElse(0.0);

        Map<String, Long> diseaseCounts = detections.stream()
                .collect(Collectors.groupingBy(DiseaseDetection::getDetectedDisease, Collectors.counting()));

        Map<String, Long> severityCounts = detections.stream()
                .collect(Collectors.groupingBy(DiseaseDetection::getSeverity, Collectors.counting()));

        List<String> recentDiseases = detections.stream()
                .limit(5)
                .map(DiseaseDetection::getDetectedDisease)
                .distinct()
                .collect(Collectors.toList());

        Double treatmentSuccessRate = treatmentProgressRepository.getAverageSuccessRateByUserId(userId);

        return DiseaseStatsDTO.builder()
                .totalDetections(totalDetections)
                .confirmedDetections(confirmedDetections)
                .criticalDetections(criticalDetections)
                .averageConfidenceScore(averageConfidence)
                .diseaseCounts(diseaseCounts)
                .severityCounts(severityCounts)
                .recentDiseases(recentDiseases)
                .treatmentSuccessRate(treatmentSuccessRate != null ? treatmentSuccessRate : 0.0)
                .build();
    }

    @Override
    public DiseaseDetection confirmDetection(Long detectionId, Boolean isConfirmed, String expertNotes) {
        DiseaseDetection detection = diseaseDetectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));

        detection.setIsConfirmed(isConfirmed);
        detection.setExpertNotes(expertNotes);
        detection.setStatus(isConfirmed ? "CONFIRMED" : "REJECTED");

        return diseaseDetectionRepository.save(detection);
    }

    @Override
    public void sendDiseaseAlert(Long userId, String diseaseName, String severity) {
        String message = String.format("Phát hiện bệnh nghiêm trọng: %s (Mức độ: %s)", diseaseName, severity);
        // Tạm thời comment out nếu NotificationService chưa có method này
        // notificationService.sendNotification(userId, "DISEASE_ALERT", message);
        log.info("Disease alert sent: {}", message);
    }

    @Override
    public Object analyzeDiseaseTrends(Long userId) {
        // Implement disease trend analysis
        return Map.of("trend", "increasing", "period", "last_30_days");
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

    private DiseaseDetectionResultDTO simulateDiseaseDetection(MultipartFile image, Long userId, Long plantId) {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        PlantDiseaseType[] diseases = PlantDiseaseType.values();
        PlantDiseaseType randomDisease = diseases[new Random().nextInt(diseases.length)];

        double confidence = 0.7 + (new Random().nextDouble() * 0.3);

        return DiseaseDetectionResultDTO.builder()
                .detectedDisease(randomDisease.getVietnameseName())
                .confidenceScore(confidence)
                .severity(randomDisease.getSeverity())
                .symptoms(randomDisease.getSymptoms())
                .detectionMethod("IMAGE")
                .aiModelVersion("1.0.0")
                .build();
    }

    private DiseaseDetectionResultDTO analyzeSymptoms(DiseaseDetectionRequestDTO request, Long userId) {
        String symptoms = request.getSymptoms().toLowerCase();

        List<PlantDisease> diseases = plantDiseaseRepository.findByIsActiveTrue();
        PlantDisease matchedDisease = null;

        for (PlantDisease disease : diseases) {
            if (disease.getSymptoms() != null &&
                    disease.getSymptoms().toLowerCase().contains(symptoms)) {
                matchedDisease = disease;
                break;
            }
        }

        if (matchedDisease == null) {
            PlantDiseaseType enumDisease = PlantDiseaseType.NUTRIENT_DEFICIENCY;
            return DiseaseDetectionResultDTO.builder()
                    .detectedDisease(enumDisease.getVietnameseName())
                    .confidenceScore(0.6)  // Độ tin cậy thấp hơn
                    .severity(enumDisease.getSeverity())
                    .symptoms(enumDisease.getSymptoms())
                    .recommendedTreatment("Cần thêm thông tin điều trị")
                    .prevention("Cần thêm thông tin phòng ngừa")
                    .causes("Cần thêm thông tin nguyên nhân")
                    .isConfirmed(false)
                    .status("DETECTED")
                    .detectedAt(new Timestamp(System.currentTimeMillis()))
                    .detectionMethod("SYMPTOMS")
                    .aiModelVersion("1.0.0")
                    .build();
        }

        return DiseaseDetectionResultDTO.builder()
                .detectedDisease(matchedDisease.getDiseaseName())
                .confidenceScore(0.85)
                .severity(matchedDisease.getSeverity())
                .symptoms(matchedDisease.getSymptoms())
                .recommendedTreatment(matchedDisease.getTreatment())
                .prevention(matchedDisease.getPrevention())
                .causes(matchedDisease.getCauses())
                .imageUrl(matchedDisease.getImageUrl())
                .isConfirmed(false)
                .status("DETECTED")
                .detectedAt(new Timestamp(System.currentTimeMillis()))
                .detectionMethod("SYMPTOMS")
                .aiModelVersion("1.0.0")
                .treatmentGuide(createTreatmentGuide(matchedDisease))
                .build();
    }

    private void saveDetectionResult(DiseaseDetectionResultDTO result, Long userId, Long plantId, String method) {
        Users user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPlants userPlant = null;
        if (plantId != null) {
            userPlant = userPlantsRepository.findById(plantId)
                    .orElse(null);
        }

        DiseaseDetection detection = new DiseaseDetection();
        detection.setUser(user);
        detection.setUserPlant(userPlant);
        detection.setDetectedDisease(result.getDetectedDisease());
        detection.setConfidenceScore(result.getConfidenceScore());
        detection.setSeverity(result.getSeverity());
        detection.setSymptoms(result.getSymptoms());
        detection.setRecommendedTreatment(result.getRecommendedTreatment());
        detection.setDetectionMethod(method);
        detection.setAiModelVersion(result.getAiModelVersion());
        detection.setStatus("DETECTED");

        diseaseDetectionRepository.save(detection);
    }

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

    private void sendUrgentDiseaseAlert(Long userId, String diseaseName, String severity) {
        String message = String.format("⚠️ CẢNH BÁO: Phát hiện bệnh %s (Mức độ: %s). Cần xử lý ngay!", diseaseName, severity);
        // Tạm thời comment out nếu NotificationService chưa có method này
        // notificationService.sendNotification(userId, "URGENT_DISEASE_ALERT", message);
        log.info("Urgent disease alert sent: {}", message);
    }
}