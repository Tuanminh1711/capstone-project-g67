package com.plantcare_backend.repository;

import com.plantcare_backend.model.PlantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantImageRepository extends JpaRepository<PlantImage, Long> {
    List<PlantImage> findByPlantId(Long plantId);
}
