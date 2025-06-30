package com.plantcare_backend.repository;

import com.plantcare_backend.model.Plants;
import com.plantcare_backend.model.UserPlants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPlantRepository extends JpaRepository<UserPlants, Long> {
    Page<UserPlants> findAll(Pageable pageable);
    long count();

    Page<UserPlants> findByUserId(Long userId, Pageable pageable);
    Page<UserPlants> findByPlantNameContainingIgnoreCase(String plantName, Pageable pageable);
    Page<UserPlants> findByUserIdAndPlantNameContainingIgnoreCase(Long userId, String plantName, Pageable pageable);
    
    // Find user plant by userPlantId and userId for security validation
    Optional<UserPlants> findByUserPlantIdAndUserId(Long userPlantId, Long userId);
}
