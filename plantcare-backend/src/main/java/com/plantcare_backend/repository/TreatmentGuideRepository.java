package com.plantcare_backend.repository;

import com.plantcare_backend.model.TreatmentGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentGuideRepository extends JpaRepository<TreatmentGuide, Long> {
    List<TreatmentGuide> findByDiseaseIdOrderByStepNumber(Long diseaseId);
}
