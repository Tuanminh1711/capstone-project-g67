package com.example.plantcare_backend.repository;

import com.example.plantcare_backend.model.UserProfile;
import com.example.plantcare_backend.model.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    UserProfile findByUser(Users user);


    @Query(value = "SELECT up.* FROM user_profiles up " +
            "JOIN users u ON up.user_id = u.id " +
            "WHERE u.id = :userId AND u.status = 'ACTIVE'", nativeQuery = true)
    UserProfile findUserProfileDetails(@Param("userId") Integer userId);

}
