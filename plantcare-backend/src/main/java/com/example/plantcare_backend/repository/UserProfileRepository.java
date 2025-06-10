package com.example.plantcare_backend.repository;

import com.example.plantcare_backend.model.UserProfile;
import com.example.plantcare_backend.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    UserProfile findByUser(Users user);
}
