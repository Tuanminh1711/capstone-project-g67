package com.plantcare_backend.controller.VIP;

import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.service.external_service.VNPayService;
import com.plantcare_backend.service.vip.VipOrderService;
import com.plantcare_backend.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:4200/")
public class PaymentController {
    @Autowired
    private VipOrderService vipOrderService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private VNPayService vnPayService;

    @PostMapping("/vnpay/create")
    public ResponseEntity<?> createVNPayPayment(
            @RequestParam Integer userId,
            @RequestParam BigDecimal amount,
            @RequestParam String subscriptionType,
            @RequestParam String returnUrl,
            HttpServletRequest request) {

        VipOrder.SubscriptionType type;
        try {
            type = VipOrder.SubscriptionType.valueOf(subscriptionType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid subscription type. Must be MONTHLY or YEARLY");
        }

        VipOrder order = vipOrderService.createOrder(userId, amount, type);

        activityLogService.logActivity(userId, "CREATE_VNPAY_ORDER",
                "Created VNPAY order with amount: " + amount + " for " + type.getDisplayName(), request);

        String ipAddress = getClientIpAddress(request);
        String paymentUrl = vnPayService.createPaymentUrl(order, ipAddress, returnUrl);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.getOrderId());
        response.put("paymentUrl", paymentUrl);
        response.put("amount", amount);
        response.put("subscriptionType", type.getDisplayName());
        response.put("durationMonths", type.getMonths());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(@RequestParam Map<String, String> response) {
        try {
            if (!vnPayService.verifyPaymentResponse(response)) {
                return ResponseEntity.badRequest().body("Invalid payment response");
            }

            String vnp_ResponseCode = response.get("vnp_ResponseCode");
            String vnp_TxnRef = response.get("vnp_TxnRef");

            if ("00".equals(vnp_ResponseCode)) {
                Integer orderId = Integer.parseInt(vnp_TxnRef);
                VipOrder order = vipOrderService.handlePaymentSuccess(orderId);

                // ✅ Trả về thông tin user mới
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("message", "Thanh toán thành công! Tài khoản đã được nâng cấp VIP.");
                responseData.put("userId", order.getUser().getId());
                responseData.put("newRole", "VIP");
                responseData.put("username", order.getUser().getUsername());
                responseData.put("redirectTo", "/home");
                responseData.put("subscriptionType", order.getSubscriptionType().getDisplayName());
                responseData.put("durationMonths", order.getSubscriptionDurationMonths());

                return ResponseEntity.ok(responseData);
            } else {
                return ResponseEntity.badRequest().body("Thanh toán thất bại. Mã lỗi: " + vnp_ResponseCode);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xử lý thanh toán: " + e.getMessage());
        }
    }

    @PostMapping("/vnpay-ipn")
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> response) {
        try {
            if (!vnPayService.verifyPaymentResponse(response)) {
                return ResponseEntity.badRequest().body("Invalid IPN");
            }

            String vnp_ResponseCode = response.get("vnp_ResponseCode");
            String vnp_TxnRef = response.get("vnp_TxnRef");

            if ("00".equals(vnp_ResponseCode)) {
                Integer orderId = Integer.parseInt(vnp_TxnRef);
                vipOrderService.handlePaymentSuccess(orderId);
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing IPN");
        }
    }

    @GetMapping("/test-timezone")
    public ResponseEntity<?> testTimezone() {
        Map<String, Object> response = new HashMap<>();

        // Test current time in different formats
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.ZonedDateTime zonedNow = java.time.ZonedDateTime.now();
        java.util.Date utilDate = new java.util.Date();
        java.sql.Timestamp sqlTimestamp = new java.sql.Timestamp(System.currentTimeMillis());

        response.put("localDateTime", now.toString());
        response.put("zonedDateTime", zonedNow.toString());
        response.put("utilDate", utilDate.toString());
        response.put("sqlTimestamp", sqlTimestamp.toString());
        response.put("currentTimeMillis", System.currentTimeMillis());
        response.put("defaultTimezone", java.util.TimeZone.getDefault().getID());

        return ResponseEntity.ok(response);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

}
