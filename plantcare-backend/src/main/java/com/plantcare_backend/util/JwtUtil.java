package com.plantcare_backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Create by TaHoang
 */

@Component
public interface JwtUtil {
    String generateToken(String username, String role);

    String getUsernameFromToken(String token);

    String getRoleFromToken(String token);

    boolean validateToken(String token);

    void addToBlacklist(String token);

    boolean isTokenBlacklisted(String token);

    // Thêm method mới để phù hợp với Spring Security
    List<GrantedAuthority> getAuthoritiesFromToken(String token);
}
