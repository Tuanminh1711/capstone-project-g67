package com.plantcare_backend.repository;

import com.plantcare_backend.model.ChatMessage;
import io.lettuce.core.dynamic.annotation.Param;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatType = 'COMMUNITY' ORDER BY cm.sentAt DESC")
    List<ChatMessage> findCommunityMessages();

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatType = 'PRIVATE' AND " +
            "((cm.sender.id = :user1Id AND cm.receiver.id = :user2Id) OR " +
            "(cm.sender.id = :user2Id AND cm.receiver.id = :user1Id)) " +
            "ORDER BY cm.sentAt ASC")
    List<ChatMessage> findPrivateMessages(@Param("user1Id") Integer user1Id,
                                          @Param("user2Id") Integer user2Id);

    @Query("SELECT DISTINCT cm.conversationId FROM ChatMessage cm WHERE cm.chatType = 'PRIVATE' AND " +
            "(cm.sender.id = :userId OR cm.receiver.id = :userId)")
    List<String> findConversationIdsByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.receiver.id = :userId AND cm.isRead = false")
    Long countUnreadMessages(@Param("userId") Integer userId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage cm SET cm.isRead = true WHERE cm.receiver.id = :userId AND cm.isRead = false")
    void markMessagesAsRead(@Param("userId") Integer userId);
}
