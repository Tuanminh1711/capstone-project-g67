package com.plantcare_backend.service.vip;

import com.plantcare_backend.model.VipOrder;

import java.math.BigDecimal;

public interface VipOrderService {
    VipOrder findById(Integer orderId);
    VipOrder createOrder(Integer userId, BigDecimal amount, VipOrder.SubscriptionType subscriptionType);
    VipOrder handlePaymentSuccess(Integer orderId);

}
