package com.plantcare_backend.repository;

import com.plantcare_backend.model.CareSchedule;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface CareScheduleRepository extends JpaRepository<CareSchedule, Long> {
    List<CareSchedule> findByUserPlant_UserPlantId(Long userPlantId);
    List<CareSchedule> findByUserPlant_UserId(Long userId);

    @Query("SELECT cs FROM CareSchedule cs WHERE cs.nextCareDate <= :date AND cs.userPlant.reminder_enabled = true")
    List<CareSchedule> findUpcomingCareSchedules(@Param("date") Date date);

    @Query("SELECT cs FROM CareSchedule cs WHERE cs.userPlant.userId = :userId AND cs.nextCareDate <= :date")
    List<CareSchedule> findUserUpcomingCareSchedules(@Param("userId") Long userId, @Param("date") Date date);
}
