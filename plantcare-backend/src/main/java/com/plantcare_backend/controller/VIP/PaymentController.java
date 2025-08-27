package com.plantcare_backend.controller.VIP;

import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.service.external_service.VNPayService;
import com.plantcare_backend.service.vip.VipOrderService;
import com.plantcare_backend.service.ActivityLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@Slf4j
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

        String clientIp = getClientIpAddress(request);
        if (isRateLimited(clientIp)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            return ResponseEntity.status(429).body("Quá nhiều requests. Vui lòng thử lại sau.");
        }


        VipOrder.SubscriptionType type;
        try {
            type = VipOrder.SubscriptionType.valueOf(subscriptionType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid subscription type. Must be MONTHLY or YEARLY");
        }

        VipOrder order = vipOrderService.createOrder(userId, amount, type);

        log.info("Creating VNPAY payment - Order: {}, Amount: {}, User: {}, IP: {}",
                order.getOrderId(), amount, userId, getClientIpAddress(request));

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
            String vnp_TxnRef = response.get("vnp_TxnRef");
            String vnp_Amount = response.get("vnp_Amount");

            VipOrder orderForValidation = vipOrderService.findById(Integer.parseInt(vnp_TxnRef));
            if (orderForValidation == null) {
                log.warn("Payment validation failed - Order không tồn tại: {}", vnp_TxnRef);
                return ResponseEntity.badRequest().body("Order không tồn tại");
            }

            BigDecimal vnpayAmount = new BigDecimal(vnp_Amount).divide(new BigDecimal("100"));
            if (!orderForValidation.getAmount().equals(vnpayAmount)) {
                log.warn("Payment validation failed - Amount mismatch - Order: {}, Expected: {}, Actual: {}",
                        vnp_TxnRef, orderForValidation.getAmount(), vnpayAmount);
                return ResponseEntity.badRequest().body("Số tiền không khớp");
            }

            if (!vnPayService.verifyPaymentResponse(response)) {
                log.warn("Payment validation failed - VNPAY signature invalid for order: {}", vnp_TxnRef);
                return ResponseEntity.badRequest().body("Invalid payment response");
            }

            String vnp_ResponseCode = response.get("vnp_ResponseCode");

            if ("00".equals(vnp_ResponseCode)) {
                Integer orderId = Integer.parseInt(vnp_TxnRef);
                VipOrder order = vipOrderService.handlePaymentSuccess(orderId);

                log.info("Payment successful - Order: {}, Amount: {}, User: {}",
                        orderId, order.getAmount(), order.getUser().getUsername());

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
                log.warn("Payment failed - Order: {}, Response Code: {}", vnp_TxnRef, vnp_ResponseCode);
                return ResponseEntity.badRequest().body("Thanh toán thất bại. Mã lỗi: " + vnp_ResponseCode);
            }

        } catch (NumberFormatException e) {
            log.error("Payment validation error - Invalid number format: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Dữ liệu thanh toán không hợp lệ");

        } catch (Exception e) {
            log.error("Payment processing error - Order: {}, Error: {}",
                    response.get("vnp_TxnRef"), e.getMessage(), e);
            return ResponseEntity.badRequest().body("Lỗi xử lý thanh toán: " + e.getMessage());
        }
    }

    @PostMapping("/vnpay-ipn")
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> response) {
        try {
            // ✅ THÊM VALIDATION TƯƠNG TỰ
            String vnp_TxnRef = response.get("vnp_TxnRef");
            String vnp_Amount = response.get("vnp_Amount");

            // Validate orderId và amount với database
            VipOrder orderForValidation = vipOrderService.findById(Integer.parseInt(vnp_TxnRef));
            if (orderForValidation == null) {
                log.error("IPN validation failed - Order không tồn tại: {}", vnp_TxnRef);
                return ResponseEntity.badRequest().body("Order không tồn tại");
            }

            // Convert VNPAY amount (x100) về amount thật
            BigDecimal vnpayAmount = new BigDecimal(vnp_Amount).divide(new BigDecimal("100"));
            if (!orderForValidation.getAmount().equals(vnpayAmount)) {
                log.error("IPN validation failed - Amount mismatch - Order: {}, Expected: {}, Actual: {}",
                        vnp_TxnRef, orderForValidation.getAmount(), vnpayAmount);
                return ResponseEntity.badRequest().body("Amount mismatch");
            }

            // ✅ CODE CŨ GIỮ NGUYÊN
            if (!vnPayService.verifyPaymentResponse(response)) {
                log.error("IPN validation failed - VNPAY signature invalid for order: {}", vnp_TxnRef);
                return ResponseEntity.badRequest().body("Invalid IPN");
            }

            String vnp_ResponseCode = response.get("vnp_ResponseCode");
            if ("00".equals(vnp_ResponseCode)) {
                Integer orderId = Integer.parseInt(vnp_TxnRef);
                vipOrderService.handlePaymentSuccess(orderId);
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("IPN Error: ", e);
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

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> lastRequestTimes = new ConcurrentHashMap<>();

    private boolean isRateLimited(String clientIp) {
        long currentTime = System.currentTimeMillis();
        long lastRequest = lastRequestTimes.getOrDefault(clientIp, 0L);

        // Reset counter nếu đã qua 1 phút
        if (currentTime - lastRequest > 60000) {
            requestCounts.put(clientIp, 1);
            lastRequestTimes.put(clientIp, currentTime);
            return false;
        }

        // Kiểm tra số requests trong 1 phút
        int count = requestCounts.getOrDefault(clientIp, 0);
        if (count >= 5) { // Tối đa 5 requests/phút
            return true;
        }

        requestCounts.put(clientIp, count + 1);
        lastRequestTimes.put(clientIp, currentTime);
        return false;
    }
}
