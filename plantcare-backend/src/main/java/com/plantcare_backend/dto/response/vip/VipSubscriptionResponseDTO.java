package com.plantcare_backend.dto.response.vip;

import com.plantcare_backend.model.VipSubscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VipSubscriptionResponseDTO {
    private Integer subscriptionId;
    private Integer userId;
    private String username;
    private String subscriptionType;
    private String subscriptionTypeDisplay;
    private Integer durationMonths;
    private Timestamp startDate;
    private Timestamp endDate;
    private String status;
    private Boolean isActive;
    private Boolean autoRenewalEnabled;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public static VipSubscriptionResponseDTO fromEntity(VipSubscription subscription) {
        if (subscription == null) {
            return null;
        }

        return VipSubscriptionResponseDTO.builder()
                .subscriptionId(subscription.getSubscriptionId())
                .userId(subscription.getUser().getId())
                .username(subscription.getUser().getUsername())
                .subscriptionType(subscription.getSubscriptionType().name())
                .subscriptionTypeDisplay(subscription.getSubscriptionType().getDisplayName())
                .durationMonths(subscription.getSubscriptionDurationMonths())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .status(subscription.getStatus().name())
                .isActive(subscription.isActive())
                .autoRenewalEnabled(subscription.getAutoRenewalEnabled())
                .createdAt(subscription.getCreatedAt())
                .updatedAt(subscription.getUpdatedAt())
                .build();
    }
}
