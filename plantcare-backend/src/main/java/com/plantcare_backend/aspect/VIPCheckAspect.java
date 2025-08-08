package com.plantcare_backend.aspect;

import com.plantcare_backend.annotation.VIPOnly;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import com.plantcare_backend.service.vip.VipSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class VIPCheckAspect {
    private final UserRepository userRepository;
    @Autowired
    private VipSubscriptionService vipSubscriptionService;

    @Around("@annotation(vipOnly)")
    public Object checkVIPAccess(ProceedingJoinPoint joinPoint, VIPOnly vipOnly) throws Throwable {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AccessDeniedException("User not authenticated");
            }

            String username = authentication.getName();
            Users user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AccessDeniedException("User not found"));

            // Kiểm tra role VIP
            if (user.getRole() != null && "VIP".equals(user.getRole().getRoleName().name())) {
                // Kiểm tra thêm subscription có active không
                if (vipSubscriptionService.isUserVipActive(user.getId())) {
                    log.info("VIP access granted for user: {}", username);
                    return joinPoint.proceed();
                } else {
                    log.warn("VIP subscription expired for user: {}", username);
                    throw new AccessDeniedException("VIP subscription has expired");
                }
            } else {
                log.warn("VIP access denied for user: {} (role: {})", username,
                        user.getRole() != null ? user.getRole().getRoleName() : "NO_ROLE");
                throw new AccessDeniedException("VIP access required");
            }

        } catch (Exception e) {
            log.error("Error checking VIP access", e);
            throw new AccessDeniedException("Lỗi kiểm tra quyền truy cập");
        }
    }
}
