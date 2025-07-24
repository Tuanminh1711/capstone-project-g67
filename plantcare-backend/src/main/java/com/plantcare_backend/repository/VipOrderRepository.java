package com.plantcare_backend.repository;

import com.plantcare_backend.model.VipOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VipOrderRepository extends JpaRepository<VipOrder, Integer> {
}
