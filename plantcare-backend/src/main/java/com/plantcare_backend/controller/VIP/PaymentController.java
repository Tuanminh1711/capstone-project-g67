package com.plantcare_backend.controller.VIP;

import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.service.VipOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    @Autowired
    private VipOrderService vipOrderService;

    @PostMapping("/vip")
    public ResponseEntity<?> createVipOrder(@RequestParam Integer userId, @RequestParam BigDecimal amount) {
        VipOrder order = vipOrderService.createOrder(userId, amount);
        // Trả về URL giả lập thanh toán
        String paymentUrl = "http://localhost:8080/api/payment/vnpay-demo?orderId=" + order.getOrderId();
        return ResponseEntity.ok(Map.of("orderId", order.getOrderId(), "paymentUrl", paymentUrl));
    }

    // Endpoint giả lập thanh toán thành công
    @GetMapping("/vnpay-demo")
    public ResponseEntity<?> vnpayDemo(@RequestParam Integer orderId) {
        vipOrderService.handlePaymentSuccess(orderId);
        return ResponseEntity.ok("Thanh toán VIP thành công! Tài khoản đã được nâng cấp.");
    }
}
