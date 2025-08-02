package com.plantcare_backend.aspect;

import com.plantcare_backend.annotation.VIPOnly;
import com.plantcare_backend.model.Role;
import com.plantcare_backend.model.Users;
import com.plantcare_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class VIPCheckAspect {
    private final UserRepository userRepository;

    @Around("@annotation(vipOnly)")
    public Object checkVIPAccess(ProceedingJoinPoint joinPoint, VIPOnly vipOnly) throws Throwable {
        try {
            // Lấy user ID từ SecurityContext
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            if (principal == null) {
                throw new AccessDeniedException("Vui lòng đăng nhập để sử dụng tính năng này");
            }

            Long userId = (Long) principal;
            log.info("Checking VIP access for user ID: {}", userId);

            // Lấy thông tin user từ database
            Users user = userRepository.findById(Math.toIntExact(userId))
                    .orElseThrow(() -> new AccessDeniedException("User không tồn tại"));

            // Kiểm tra role VIP
            if (user.getRole() == null || !user.getRole().getRoleName().equals(Role.RoleName.VIP)) {
                log.warn("User {} (ID: {}) attempted to access VIP feature with role: {}",
                        user.getUsername(), userId,
                        user.getRole() != null ? user.getRole().getRoleName() : "NULL");

                throw new AccessDeniedException(vipOnly.message());
            }

            log.info("VIP access granted for user: {} (ID: {})", user.getUsername(), userId);
            return joinPoint.proceed();

        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error checking VIP access", e);
            throw new AccessDeniedException("Lỗi kiểm tra quyền truy cập");
        }
    }
}
