package com.plantcare_backend.service.impl;

import com.plantcare_backend.model.Notification;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.repository.RoleRepository;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.repository.VipOrderRepository;
import com.plantcare_backend.service.NotificationService;
import com.plantcare_backend.service.VipOrderService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;


@Service
@Slf4j
public class VipOrderServiceImpl implements VipOrderService {
    @Autowired
    private VipOrderRepository vipOrderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private NotificationService notificationService;

    @Override
    public VipOrder createOrder(Integer userId, BigDecimal amount) {
        Users user = userRepository.findById(userId).orElseThrow();
        VipOrder order = VipOrder.builder()
                .user(user)
                .amount(amount)
                .status(VipOrder.Status.PENDING)
                .paymentMethod("VNPAY")
                .build();
        return vipOrderRepository.save(order);
    }

    @Override
    @Transactional
    public VipOrder handlePaymentSuccess(Integer orderId) {
        VipOrder order = vipOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() == VipOrder.Status.SUCCESS) {
            return order;
        }

        order.setStatus(VipOrder.Status.SUCCESS);
        vipOrderRepository.save(order);

        // Update user role
        Role vipRole = roleRepository.findByRoleName(Role.RoleName.VIP)
                .orElseThrow(() -> new RuntimeException("VIP role not found"));
        Users user = order.getUser();
        user.setRole(vipRole);
        userRepository.save(user);
        try {
            notificationService.createNotification(
                    (long) order.getUser().getId(),
                    "Nâng cấp VIP thành công",
                    "Chúc mừng! Tài khoản của bạn đã được nâng cấp lên VIP.",
                    Notification.NotificationType.SUCCESS,
                    "/vip/benefits" // link đến trang lợi ích VIP
            );
        } catch (Exception e) {
            log.warn("Failed to create notification for VIP upgrade: {}", e.getMessage());
        }
        return order;
    }
}
