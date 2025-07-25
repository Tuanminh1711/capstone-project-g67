package com.plantcare_backend.service;

import com.plantcare_backend.model.VipOrder;

import java.util.Map;

public interface VNPayService {
    String createPaymentUrl(VipOrder order, String ipAddress);
    boolean verifyPaymentResponse(Map<String, String> response);
    String generateChecksum(Map<String, String> params);
}
