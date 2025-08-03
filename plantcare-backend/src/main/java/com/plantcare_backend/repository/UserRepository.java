package com.plantcare_backend.repository;

import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Create by TaHoang
 */

@Repository
public interface UserRepository extends JpaRepository<Users, Integer>, JpaSpecificationExecutor<Users> {
    Optional<Users> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<Users> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Users> findUserById(Long userId);

    @Query("SELECT u FROM Users u WHERE u.role.roleName IN :roles AND u.status = 'ACTIVE'")
    List<Users> findByRoleIn(@Param("roles") List<String> roles);

    @Query("SELECT DATE(u.createdAt) as date, COUNT(u) as totalRegistered " +
            "FROM Users u " +
            "WHERE u.createdAt BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE(u.createdAt) " +
            "ORDER BY DATE(u.createdAt) ASC")
    List<Object[]> countUsersRegisteredByDate(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT u FROM Users u JOIN FETCH u.role WHERE u.id = :id")
    Optional<Users> findByIdWithRole(@Param("id") Long id);

    List<Users> findByRole_RoleNameIn(List<String> roleNames);
}