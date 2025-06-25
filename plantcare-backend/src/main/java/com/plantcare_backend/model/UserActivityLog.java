package com.plantcare_backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * created by tahoang
 */

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "user_activity_log")
public class UserActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với bảng Users
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private Users user;

    // Loại hành động: LOGIN, LOGOUT, UPDATE_PROFILE, CHANGE_PASSWORD, ...
    @Column(nullable = false)
    private String action;

    // Thời điểm thực hiện hành động
    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Địa chỉ IP thực hiện (nếu cần)
    private String ipAddress;

    // Mô tả chi tiết (nếu cần)
    private String description;
}
