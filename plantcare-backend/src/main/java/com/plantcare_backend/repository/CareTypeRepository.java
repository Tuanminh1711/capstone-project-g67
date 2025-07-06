package com.plantcare_backend.repository;

import com.plantcare_backend.model.CareType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CareTypeRepository extends JpaRepository<CareType, Long> {
    Optional<CareType> findByCareTypeName(String careTypeName);
    List<CareType> findAll();
}
