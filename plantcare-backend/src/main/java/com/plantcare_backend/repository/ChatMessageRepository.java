package com.plantcare_backend.repository;

import com.plantcare_backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Method findByIdWithRole đã được di chuyển đến UserRepository
}
