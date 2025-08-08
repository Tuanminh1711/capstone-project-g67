package com.plantcare_backend.repository;

import com.plantcare_backend.model.VipSubscription;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public interface VipSubscriptionRepository extends JpaRepository<VipSubscription, Long> {
    Optional<VipSubscription> findByUserId(Integer userId);

    @Query("SELECT vs FROM VipSubscription vs WHERE vs.status = 'ACTIVE' AND vs.endDate <= :currentTime")
    List<VipSubscription> findExpiredSubscriptions(@Param("currentTime") Timestamp currentTime);

    @Query("SELECT vs FROM VipSubscription vs WHERE vs.status = 'ACTIVE' AND vs.endDate BETWEEN :startDate AND :endDate")
    List<VipSubscription> findSubscriptionsExpiringBetween(@Param("startDate") Timestamp startDate,
                                                           @Param("endDate") Timestamp endDate);

    @Query("SELECT COUNT(vs) FROM VipSubscription vs WHERE vs.status = 'ACTIVE'")
    Long countActiveSubscriptions();
}
