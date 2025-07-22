package com.plantcare_backend.repository;

import com.plantcare_backend.model.ChatMessage;
import com.plantcare_backend.model.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT u FROM Users u JOIN FETCH u.role WHERE u.id = :id")
    Users findByIdWithRole(@Param("id") Long id);
}
