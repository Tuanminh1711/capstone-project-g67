package com.plantcare_backend.controller.VIP;

import com.plantcare_backend.dto.response.vip.VipSubscriptionResponseDTO;
import com.plantcare_backend.model.VipOrder;
import com.plantcare_backend.model.VipSubscription;
import com.plantcare_backend.service.vip.VipSubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vip/subscription")
@CrossOrigin(origins = "http://localhost:4200/")
public class VipSubscriptionController {
    @Autowired
    private VipSubscriptionService vipSubscriptionService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getSubscription(@PathVariable Integer userId) {
        try {
            VipSubscription subscription = vipSubscriptionService.getSubscriptionByUserId(userId);
            if (subscription == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(VipSubscriptionResponseDTO.fromEntity(subscription));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}/status")
    public ResponseEntity<?> getVipStatus(@PathVariable Integer userId) {
        try {
            boolean isActive = vipSubscriptionService.isUserVipActive(userId);
            VipSubscription activeSubscription = vipSubscriptionService.getActiveSubscription(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("isVipActive", isActive);
            response.put("subscription", activeSubscription != null ?
                    VipSubscriptionResponseDTO.fromEntity(activeSubscription) : null);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/extend")
    public ResponseEntity<?> extendSubscription(
            @PathVariable Integer userId,
            @RequestParam String subscriptionType) {
        try {
            VipOrder.SubscriptionType type = VipOrder.SubscriptionType.valueOf(subscriptionType.toUpperCase());
            VipSubscription subscription = vipSubscriptionService.extendSubscription(userId, type);
            return ResponseEntity.ok(VipSubscriptionResponseDTO.fromEntity(subscription));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid subscription type. Must be MONTHLY or YEARLY");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable Integer userId) {
        try {
            vipSubscriptionService.cancelSubscription(userId);
            return ResponseEntity.ok(Map.of("message", "Subscription cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
