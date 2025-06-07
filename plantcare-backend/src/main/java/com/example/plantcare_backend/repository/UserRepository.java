package com.example.plantcare_backend.repository;

import com.example.plantcare_backend.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Create by TaHoang
 */

@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {
        Optional<Users> findByUsername(String username);

        boolean existsByUsername(String username);
}