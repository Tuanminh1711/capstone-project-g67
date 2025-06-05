package com.example.PlantCare_Website_Backend.repository;

import com.example.PlantCare_Website_Backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByRoleName(Role.RoleName roleName);
}