package com.plantcare_backend.service;

import com.plantcare_backend.dto.request.expert.CreatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.UpdatePlantDiseaseRequestDTO;
import com.plantcare_backend.dto.request.expert.CreateTreatmentGuideRequestDTO;
import com.plantcare_backend.dto.response.expert.PlantDiseaseDetailResponseDTO;
import com.plantcare_backend.dto.response.expert.TreatmentGuideResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ExpertDiseaseService {

    // PlantDisease CRUD
    PlantDiseaseDetailResponseDTO createPlantDisease(CreatePlantDiseaseRequestDTO request, Long expertId);

    PlantDiseaseDetailResponseDTO updatePlantDisease(Long diseaseId, UpdatePlantDiseaseRequestDTO request,
            Long expertId);

    void deletePlantDisease(Long diseaseId, Long expertId);

    PlantDiseaseDetailResponseDTO getPlantDiseaseById(Long diseaseId);

    Page<PlantDiseaseDetailResponseDTO> getAllPlantDiseases(Pageable pageable);

    // TreatmentGuide CRUD
    TreatmentGuideResponseDTO createTreatmentGuide(Long diseaseId, CreateTreatmentGuideRequestDTO request,
            Long expertId);

    TreatmentGuideResponseDTO updateTreatmentGuide(Long guideId, CreateTreatmentGuideRequestDTO request, Long expertId);

    void deleteTreatmentGuide(Long guideId, Long expertId);

    List<TreatmentGuideResponseDTO> getTreatmentGuidesByDisease(Long diseaseId);

    // Validation & Business Logic
    void validateDiseaseData(CreatePlantDiseaseRequestDTO request);

    void validateTreatmentGuideData(CreateTreatmentGuideRequestDTO request);

    boolean isExpertAuthorized(Long expertId, Long diseaseId);
}


