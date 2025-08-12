package com.plantcare_backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantcare_backend.dto.request.expert.CreatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateTreatmentGuideRequestDTO;
import com.plantcare_backend.dto.response.expert.PlantDiseaseDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.TreatmentGuideResponseDTO;
import com.plantcare_backend.exception.InvalidDataException;
import com.plantcare_backend.exception.ResourceNotFoundException;
import com.plantcare_backend.model.PlantDisease;
import com.plantcare_backend.model.TreatmentGuide;
import com.plantcare_backend.repository.PlantDiseaseRepository;
import com.plantcare_backend.repository.TreatmentGuideRepository;
import com.plantcare_backend.service.ExpertDiseaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ExpertDiseaseServiceImpl implements ExpertDiseaseService {

    private final PlantDiseaseRepository plantDiseaseRepository;
    private final TreatmentGuideRepository treatmentGuideRepository;
    private final ObjectMapper objectMapper;

    @Override
    public PlantDiseaseDetailResponseDTO createPlantDisease(CreatePlantDiseaseRequestDTO request, Long expertId) {
        log.info("Expert {} creating new plant disease: {}", expertId, request.getDiseaseName());

        // Validate input data
        validateDiseaseData(request);

        // Check if disease name already exists
        if (plantDiseaseRepository.existsByDiseaseNameIgnoreCase(request.getDiseaseName())) {
            throw new InvalidDataException("Bệnh với tên '" + request.getDiseaseName() + "' đã tồn tại trong hệ thống");
        }

        // Create new PlantDisease
        PlantDisease plantDisease = PlantDisease.builder()
                .diseaseName(request.getDiseaseName())
                .scientificName(request.getScientificName())
                .category(request.getCategory())
                .symptoms(request.getSymptoms())
                .causes(request.getCauses())
                .treatment(request.getTreatment())
                .prevention(request.getPrevention())
                .severity(request.getSeverity())
                .affectedPlantTypes(request.getAffectedPlantTypes())
                .imageUrl(request.getImageUrl())
                .confidenceLevel(request.getConfidenceLevel())
                .isActive(true)
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .updatedAt(new Timestamp(System.currentTimeMillis()))
                .build();

        PlantDisease savedDisease = plantDiseaseRepository.save(plantDisease);
        log.info("Plant disease created successfully with ID: {}", savedDisease.getId());

        return mapToPlantDiseaseDetailResponse(savedDisease);
    }

    @Override
    public PlantDiseaseDetailResponseDTO updatePlantDisease(Long diseaseId, UpdatePlantDiseaseRequestDTO request,
            Long expertId) {
        log.info("Expert {} updating plant disease: {}", expertId, diseaseId);

        validateDiseaseData(request);

        PlantDisease existingDisease = plantDiseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh với ID: " + diseaseId));

        if (!isExpertAuthorized(expertId, diseaseId)) {
            throw new InvalidDataException("Bạn không có quyền cập nhật bệnh này");
        }


        if (!existingDisease.getDiseaseName().equalsIgnoreCase(request.getDiseaseName()) &&
                plantDiseaseRepository.existsByDiseaseNameIgnoreCase(request.getDiseaseName())) {
            throw new InvalidDataException("Bệnh với tên '" + request.getDiseaseName() + "' đã tồn tại trong hệ thống");
        }

        existingDisease.setDiseaseName(request.getDiseaseName());
        existingDisease.setScientificName(request.getScientificName());
        existingDisease.setCategory(request.getCategory());
        existingDisease.setSymptoms(request.getSymptoms());
        existingDisease.setCauses(request.getCauses());
        existingDisease.setTreatment(request.getTreatment());
        existingDisease.setPrevention(request.getPrevention());
        existingDisease.setSeverity(request.getSeverity());
        existingDisease.setAffectedPlantTypes(request.getAffectedPlantTypes());
        existingDisease.setImageUrl(request.getImageUrl());
        existingDisease.setConfidenceLevel(request.getConfidenceLevel());
        existingDisease.setIsActive(request.getIsActive());
        existingDisease.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        PlantDisease updatedDisease = plantDiseaseRepository.save(existingDisease);
        log.info("Plant disease updated successfully: {}", diseaseId);

        return mapToPlantDiseaseDetailResponse(updatedDisease);
    }

    @Override
    public void deletePlantDisease(Long diseaseId, Long expertId) {
        log.info("Expert {} deleting plant disease: {}", expertId, diseaseId);

        // Check if disease exists
        PlantDisease existingDisease = plantDiseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh với ID: " + diseaseId));

        // Check if expert is authorized
        if (!isExpertAuthorized(expertId, diseaseId)) {
            throw new InvalidDataException("Bạn không có quyền xóa bệnh này");
        }

        // Soft delete - set isActive to false
        existingDisease.setIsActive(false);
        existingDisease.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        plantDiseaseRepository.save(existingDisease);

        log.info("Plant disease soft deleted successfully: {}", diseaseId);
    }

    @Override
    public PlantDiseaseDetailResponseDTO getPlantDiseaseById(Long diseaseId) {
        log.info("Getting plant disease by ID: {}", diseaseId);

        PlantDisease disease = plantDiseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh với ID: " + diseaseId));

        return mapToPlantDiseaseDetailResponse(disease);
    }

    @Override
    public Page<PlantDiseaseDetailResponseDTO> getAllPlantDiseases(Pageable pageable) {
        log.info("Getting all plant diseases with pagination");

        Page<PlantDisease> diseases = plantDiseaseRepository.findAll(pageable);

        return diseases.map(this::mapToPlantDiseaseDetailResponse);
    }

    @Override
    public TreatmentGuideResponseDTO createTreatmentGuide(Long diseaseId, CreateTreatmentGuideRequestDTO request,
            Long expertId) {
        log.info("Expert {} creating treatment guide for disease: {}", expertId, diseaseId);

        // Validate input data
        validateTreatmentGuideData(request);

        // Check if disease exists
        PlantDisease disease = plantDiseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh với ID: " + diseaseId));

        // Check if step number already exists for this disease
        if (treatmentGuideRepository.existsByDiseaseIdAndStepNumber(diseaseId, request.getStepNumber())) {
            throw new InvalidDataException("Bước " + request.getStepNumber() + " đã tồn tại cho bệnh này");
        }

        // Create new TreatmentGuide
        TreatmentGuide treatmentGuide = TreatmentGuide.builder()
                .disease(disease)
                .stepNumber(request.getStepNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .duration(request.getDuration())
                .frequency(request.getFrequency())
                .materials(convertMaterialsToJson(request.getMaterials()))
                .notes(request.getNotes())
                .createdAt(new Timestamp(System.currentTimeMillis()))
                .build();

        TreatmentGuide savedGuide = treatmentGuideRepository.save(treatmentGuide);
        log.info("Treatment guide created successfully with ID: {}", savedGuide.getId());

        return mapToTreatmentGuideResponse(savedGuide);
    }

    @Override
    public TreatmentGuideResponseDTO updateTreatmentGuide(Long guideId, CreateTreatmentGuideRequestDTO request,
            Long expertId) {
        log.info("Expert {} updating treatment guide: {}", expertId, guideId);

        // Validate input data
        validateTreatmentGuideData(request);

        // Check if guide exists
        TreatmentGuide existingGuide = treatmentGuideRepository.findById(guideId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy hướng dẫn điều trị với ID: " + guideId));

        // Check if step number already exists for this disease (excluding current
        // guide)
        if (!existingGuide.getStepNumber().equals(request.getStepNumber()) &&
                treatmentGuideRepository.existsByDiseaseIdAndStepNumber(existingGuide.getDisease().getId(),
                        request.getStepNumber())) {
            throw new InvalidDataException("Bước " + request.getStepNumber() + " đã tồn tại cho bệnh này");
        }

        // Update guide
        existingGuide.setStepNumber(request.getStepNumber());
        existingGuide.setTitle(request.getTitle());
        existingGuide.setDescription(request.getDescription());
        existingGuide.setDuration(request.getDuration());
        existingGuide.setFrequency(request.getFrequency());
        existingGuide.setMaterials(convertMaterialsToJson(request.getMaterials()));
        existingGuide.setNotes(request.getNotes());

        TreatmentGuide updatedGuide = treatmentGuideRepository.save(existingGuide);
        log.info("Treatment guide updated successfully: {}", guideId);

        return mapToTreatmentGuideResponse(updatedGuide);
    }

    @Override
    public void deleteTreatmentGuide(Long guideId, Long expertId) {
        log.info("Expert {} deleting treatment guide: {}", expertId, guideId);

        // Check if guide exists
        TreatmentGuide guide = treatmentGuideRepository.findById(guideId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy hướng dẫn điều trị với ID: " + guideId));

        treatmentGuideRepository.delete(guide);
        log.info("Treatment guide deleted successfully: {}", guideId);
    }

    @Override
    public List<TreatmentGuideResponseDTO> getTreatmentGuidesByDisease(Long diseaseId) {
        log.info("Getting treatment guides for disease: {}", diseaseId);

        // Check if disease exists
        if (!plantDiseaseRepository.existsById(diseaseId)) {
            throw new ResourceNotFoundException("Không tìm thấy bệnh với ID: " + diseaseId);
        }

        List<TreatmentGuide> guides = treatmentGuideRepository.findByDiseaseIdOrderByStepNumber(diseaseId);

        return guides.stream()
                .map(this::mapToTreatmentGuideResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void validateDiseaseData(CreatePlantDiseaseRequestDTO request) {
        List<String> validSeverities = Arrays.asList("LOW", "MEDIUM", "HIGH", "CRITICAL");
        if (!validSeverities.contains(request.getSeverity().toUpperCase())) {
            throw new InvalidDataException(
                    "Mức độ nghiêm trọng phải là một trong các giá trị: LOW, MEDIUM, HIGH, CRITICAL");
        }

        // Validate category
        List<String> validCategories = Arrays.asList("Nấm", "Vi khuẩn", "Virus", "Sinh lý", "Côn trùng");
        if (!validCategories.contains(request.getCategory())) {
            throw new InvalidDataException(
                    "Danh mục bệnh phải là một trong các giá trị: Nấm, Vi khuẩn, Virus, Sinh lý, Côn trùng");
        }
    }

    @Override
    public void validateTreatmentGuideData(CreateTreatmentGuideRequestDTO request) {
        if (request.getStepNumber() <= 0) {
            throw new InvalidDataException("Số thứ tự bước phải lớn hơn 0");
        }
    }

    public void validateDiseaseData(UpdatePlantDiseaseRequestDTO request) {
        if (request.getDiseaseName() == null || request.getDiseaseName().trim().isEmpty()) {
            throw new InvalidDataException("Tên bệnh không được để trống");
        }

        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            throw new InvalidDataException("Danh mục bệnh không được để trống");
        }

        if (request.getSymptoms() == null || request.getSymptoms().trim().isEmpty()) {
            throw new InvalidDataException("Triệu chứng không được để trống");
        }

        if (request.getCauses() == null || request.getCauses().trim().isEmpty()) {
            throw new InvalidDataException("Nguyên nhân không được để trống");
        }

        if (request.getTreatment() == null || request.getTreatment().trim().isEmpty()) {
            throw new InvalidDataException("Phương pháp điều trị không được để trống");
        }

        if (request.getSeverity() == null || request.getSeverity().trim().isEmpty()) {
            throw new InvalidDataException("Mức độ nghiêm trọng không được để trống");
        }
    }

    @Override
    public boolean isExpertAuthorized(Long expertId, Long diseaseId) {
        // For now, all experts can manage all diseases
        // In future, you might want to add createdBy field to PlantDisease
        return true;
    }

    // Helper methods
    private PlantDiseaseDetailResponseDTO mapToPlantDiseaseDetailResponse(PlantDisease disease) {
        List<TreatmentGuideResponseDTO> guides = treatmentGuideRepository
                .findByDiseaseIdOrderByStepNumber(disease.getId())
                .stream()
                .map(this::mapToTreatmentGuideResponse)
                .collect(Collectors.toList());

        return PlantDiseaseDetailResponseDTO.builder()
                .id(disease.getId())
                .diseaseName(disease.getDiseaseName())
                .scientificName(disease.getScientificName())
                .category(disease.getCategory())
                .symptoms(disease.getSymptoms())
                .causes(disease.getCauses())
                .treatment(disease.getTreatment())
                .prevention(disease.getPrevention())
                .severity(disease.getSeverity())
                .affectedPlantTypes(disease.getAffectedPlantTypes())
                .imageUrl(disease.getImageUrl())
                .confidenceLevel(disease.getConfidenceLevel())
                .isActive(disease.getIsActive())
                .createdAt(disease.getCreatedAt())
                .updatedAt(disease.getUpdatedAt())
                .treatmentGuides(guides)
                .build();
    }

    private TreatmentGuideResponseDTO mapToTreatmentGuideResponse(TreatmentGuide guide) {
        return TreatmentGuideResponseDTO.builder()
                .id(guide.getId())
                .stepNumber(guide.getStepNumber())
                .title(guide.getTitle())
                .description(guide.getDescription())
                .duration(guide.getDuration())
                .frequency(guide.getFrequency())
                .materials(parseMaterials(guide.getMaterials()))
                .notes(guide.getNotes())
                .createdAt(guide.getCreatedAt())
                .build();
    }

    private String convertMaterialsToJson(List<String> materials) {
        if (materials == null || materials.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(materials);
        } catch (JsonProcessingException e) {
            log.error("Error converting materials to JSON", e);
            return "[]";
        }
    }

    private List<String> parseMaterials(String materialsJson) {
        if (materialsJson == null || materialsJson.trim().isEmpty()) {
            return Arrays.asList();
        }
        try {
            return objectMapper.readValue(materialsJson, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException e) {
            log.error("Error parsing materials JSON", e);
            return Arrays.asList();
        }
    }
}


