package com.plantcare_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(name = "vip_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private Users user;

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type", nullable = false)
    private SubscriptionType subscriptionType;

    @Column(name = "subscription_duration_months", nullable = false)
    private Integer subscriptionDurationMonths;

    @Column(name = "vip_start_date")
    private Timestamp vipStartDate;

    @Column(name = "vip_end_date")
    private Timestamp vipEndDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    public enum Status {
        PENDING, SUCCESS, FAILED
    }

    public enum SubscriptionType {
        MONTHLY("Tháng", 1),
        YEARLY("Năm", 12);

        private final String displayName;
        private final int months;

        SubscriptionType(String displayName, int months) {
            this.displayName = displayName;
            this.months = months;
        }

        public String getDisplayName() {
            return displayName;
        }

        public int getMonths() {
            return months;
        }
    }
}