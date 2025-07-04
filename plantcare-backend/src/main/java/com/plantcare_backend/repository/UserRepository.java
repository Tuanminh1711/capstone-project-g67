package com.plantcare_backend.repository;

import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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

    Optional<Users> findUserById(Integer userId);

    @Query("SELECT u FROM Users u WHERE u.role.roleName IN :roles AND u.status = 'ACTIVE'")
    List<Users> findByRoleIn(@Param("roles") List<String> roles);
}