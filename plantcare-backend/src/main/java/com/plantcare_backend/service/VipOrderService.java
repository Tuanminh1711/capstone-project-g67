package com.plantcare_backend.service;

import com.plantcare_backend.model.VipOrder;

import java.math.BigDecimal;

public interface VipOrderService {
    VipOrder createOrder(Integer userId, BigDecimal amount);
    VipOrder handlePaymentSuccess(Integer orderId);
}
