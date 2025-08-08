package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "vip_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Integer subscriptionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false, unique = true)
    private Users user;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type", nullable = false)
    private VipOrder.SubscriptionType subscriptionType;

    @Column(name = "subscription_duration_months", nullable = false)
    private Integer subscriptionDurationMonths;

    @Column(name = "start_date", nullable = false)
    private Timestamp startDate;

    @Column(name = "end_date", nullable = false)
    private Timestamp endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "auto_renewal_enabled")
    private Boolean autoRenewalEnabled = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    public enum Status {
        ACTIVE, EXPIRED, CANCELLED
    }

    public boolean isActive() {
        return Status.ACTIVE.equals(status) &&
                endDate != null &&
                endDate.after(new Timestamp(System.currentTimeMillis()));
    }

    public boolean isExpired() {
        return endDate != null &&
                endDate.before(new Timestamp(System.currentTimeMillis()));
    }
}
