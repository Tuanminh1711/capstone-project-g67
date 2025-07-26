package com.plantcare_backend.aspect;

import com.plantcare_backend.annotation.RateLimit;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.concurrent.ConcurrentHashMap;

@Aspect
@Component
public class RateLimitAspect {
    private final ConcurrentHashMap<String, Long> requestCounts = new ConcurrentHashMap<>();

    @Around("@annotation(rateLimit)")
    public Object rateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String clientIp = getClientIp(request);
        String key = clientIp + ":" + joinPoint.getSignature().getName();

        long currentTime = System.currentTimeMillis();
        long windowStart = currentTime - rateLimit.timeUnit().toMillis(rateLimit.value());

        requestCounts.entrySet().removeIf(entry -> entry.getValue() < windowStart);

        if (requestCounts.containsKey(key)) {
            throw new RuntimeException("Rate limit exceeded. Please try again later.");
        }

        requestCounts.put(key, currentTime);

        return joinPoint.proceed();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
