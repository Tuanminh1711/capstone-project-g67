package com.plantcare_backend.service.impl.vip;

import com.plantcare_backend.model.*;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.repository.VipSubscriptionRepository;
import com.plantcare_backend.service.NotificationService;
import com.plantcare_backend.service.vip.VipSubscriptionService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.Calendar;
import java.util.List;

@Service
@Slf4j
public class VipSubscriptionServiceImpl implements VipSubscriptionService {
    @Autowired
    private VipSubscriptionRepository vipSubscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private NotificationService notificationService;

    @Override
    @Transactional
    public VipSubscription createSubscription(VipOrder order) {
        Users user = order.getUser();

        // Kiểm tra xem user đã có subscription chưa
        VipSubscription existingSubscription = vipSubscriptionRepository.findByUserId(user.getId()).orElse(null);

        Timestamp startDate = new Timestamp(System.currentTimeMillis());
        Timestamp endDate = calculateEndDate(startDate, order.getSubscriptionDurationMonths());

        VipSubscription subscription;

        if (existingSubscription != null) {
            subscription = existingSubscription;
            subscription.setStartDate(startDate);
            subscription.setEndDate(endDate);
            subscription.setSubscriptionType(order.getSubscriptionType());
            subscription.setSubscriptionDurationMonths(order.getSubscriptionDurationMonths());
            subscription.setStatus(VipSubscription.Status.ACTIVE);
        } else {
            subscription = VipSubscription.builder().user(user).subscriptionType(order.getSubscriptionType())
                    .subscriptionDurationMonths(order.getSubscriptionDurationMonths())
                    .startDate(startDate).endDate(endDate)
                    .status(VipSubscription.Status.ACTIVE)
                    .autoRenewalEnabled(false)
                    .build();
        }

        // Cập nhật role user thành VIP
        Role vipRole = roleRepository.findByRoleName(Role.RoleName.VIP).orElseThrow(() -> new RuntimeException("VIP role not found"));
        user.setRole(vipRole);
        userRepository.save(user);

        VipSubscription savedSubscription = vipSubscriptionRepository.save(subscription);

        try {
            notificationService.createNotification((long) user.getId(),
                    "Nâng cấp VIP thành công", String.format("Chúc mừng! Tài khoản của bạn đã được nâng cấp lên VIP trong %d tháng.",
                            order.getSubscriptionDurationMonths()), Notification.NotificationType.SUCCESS, "/vip/benefits");
        } catch (Exception e) {
            log.warn("Failed to create notification for VIP upgrade: {}", e.getMessage());
        }

        return savedSubscription;
    }

    @Override
    public VipSubscription getSubscriptionByUserId(Integer userId) {
        return vipSubscriptionRepository.findByUserId(userId).orElse(null);
    }

    @Override
    @Transactional
    public VipSubscription extendSubscription(Integer userId, VipOrder.SubscriptionType subscriptionType) {
        VipSubscription existingSubscription = getSubscriptionByUserId(userId);

        if (existingSubscription == null) {
            throw new RuntimeException("No existing subscription found for user: " + userId);
        }

        Timestamp newEndDate = calculateEndDate(existingSubscription.getEndDate(), subscriptionType.getMonths());
        existingSubscription.setEndDate(newEndDate);
        existingSubscription.setSubscriptionType(subscriptionType);
        existingSubscription.setSubscriptionDurationMonths(subscriptionType.getMonths());
        existingSubscription.setStatus(VipSubscription.Status.ACTIVE);

        return vipSubscriptionRepository.save(existingSubscription);
    }

    @Override
    @Transactional
    public void cancelSubscription(Integer userId) {
        VipSubscription subscription = getSubscriptionByUserId(userId);
        if (subscription != null) {
            subscription.setStatus(VipSubscription.Status.CANCELLED);
            vipSubscriptionRepository.save(subscription);
        }
    }

    @Override
    public List<VipSubscription> getExpiredSubscriptions() {
        return vipSubscriptionRepository.findExpiredSubscriptions(new Timestamp(System.currentTimeMillis()));
    }

    @Override
    @Transactional
    public void processExpiredSubscriptions() {
        List<VipSubscription> expiredSubscriptions = getExpiredSubscriptions();

        for (VipSubscription subscription : expiredSubscriptions) {
            try {
                Users user = subscription.getUser();
                Role userRole = roleRepository.findByRoleName(Role.RoleName.USER).orElseThrow(() -> new RuntimeException("USER role not found"));
                user.setRole(userRole);
                userRepository.save(user);

                subscription.setStatus(VipSubscription.Status.EXPIRED);
                vipSubscriptionRepository.save(subscription);

                notificationService.createNotification((long) user.getId(),
                        "VIP Subscription đã hết hạn",
                        "Gói VIP của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng các tính năng VIP.",
                        Notification.NotificationType.WARNING, "/vip/renew");

                log.info("Processed expired subscription for user: {}", user.getUsername());

            } catch (Exception e) {
                log.error("Failed to process expired subscription for user: {}", subscription.getUser().getUsername(), e);
            }
        }
    }

    @Override
    public boolean isUserVipActive(Integer userId) {
        VipSubscription subscription = getActiveSubscription(userId);
        return subscription != null && subscription.isActive();
    }

    @Override
    public VipSubscription getActiveSubscription(Integer userId) {
        VipSubscription subscription = getSubscriptionByUserId(userId);
        return (subscription != null && subscription.isActive()) ? subscription : null;
    }

    private Timestamp calculateEndDate(Timestamp startDate, int months) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(startDate);
        calendar.add(Calendar.MONTH, months);
        return new Timestamp(calendar.getTimeInMillis());
    }
}
