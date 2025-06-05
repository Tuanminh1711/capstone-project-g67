package com.example.PlantCare_Website_Backend.repository;

import com.example.PlantCare_Website_Backend.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {

}