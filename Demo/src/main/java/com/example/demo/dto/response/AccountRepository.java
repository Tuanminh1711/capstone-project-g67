package com.example.demo.dto.response;

import com.example.demo.model.accounts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<accounts, Long> {
  accounts findByUsername(String username);
}
