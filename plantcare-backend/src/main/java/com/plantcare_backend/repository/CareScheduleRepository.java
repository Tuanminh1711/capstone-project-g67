package com.plantcare_backend.repository;

import com.plantcare_backend.model.CareSchedule;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CareScheduleRepository extends JpaRepository<CareSchedule, Long> {
    List<CareSchedule> findByUserPlant_UserPlantId(Long userPlantId);

    Optional<CareSchedule> findByUserPlant_UserPlantIdAndCareType_CareTypeId(Long userPlantId, Long careTypeId);

    @Query("""
                SELECT cs FROM CareSchedule cs
                JOIN FETCH cs.userPlant up
                JOIN FETCH cs.careType ct
                WHERE cs.reminderEnabled = true
                  AND cs.nextCareDate <= :date
                  AND cs.reminderTime = :reminderTime
            """)
    List<CareSchedule> findDueReminders(@Param("date") Date date, @Param("reminderTime") LocalTime reminderTime);

    @Modifying
    @Transactional
    @Query("UPDATE CareSchedule cs SET cs.lastCareDate = :lastCareDate WHERE cs.userPlant.userPlantId = :userPlantId")
    void updateLastCareDateByUserPlantId(@Param("userPlantId") Long userPlantId,
                                         @Param("lastCareDate") Date lastCareDate);
}
