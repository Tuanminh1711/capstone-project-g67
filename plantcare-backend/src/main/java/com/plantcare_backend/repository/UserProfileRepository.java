package com.plantcare_backend.repository;

import com.plantcare_backend.model.UserProfile;
import com.plantcare_backend.model.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    Optional<UserProfile> findByUser(Users user);

    @Query("SELECT up FROM UserProfile up JOIN up.user u WHERE u.id = :userId AND u.status = 'ACTIVE'")
    Optional<UserProfile> findUserProfileDetails(@Param("userId") Integer userId);

    boolean existsByPhone(String phone);
}
