package com.plantcare_backend.util.impl;

import com.plantcare_backend.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * created bt Tahoang
 */

@Component
public class JwtUtilImpl implements JwtUtil {
    private static final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static final long EXPIRATION_TIME = 864_000_000; // 10 ngày
    private static final Logger log = LoggerFactory.getLogger(JwtUtilImpl.class);
    private final Set<String> tokenBlacklist = ConcurrentHashMap.newKeySet();

    @Override
    public void addToBlacklist(String token) {
        tokenBlacklist.add(token);
        log.info("Blacklisted token: " + token);
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklist.contains(token);
    }

    @Override
    public String generateToken(String username, String role, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    @Override
    public String generateToken(String username, String role) {
        return generateToken(username, role, null);
    }

    @Override
    public String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    @Override
    public String getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("role", String.class);
    }

    @Override
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return !isTokenBlacklisted(token);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<GrantedAuthority> getAuthoritiesFromToken(String token) {
        String role = getRoleFromToken(token);
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Integer) {
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        } else if (userIdObj != null) {
            return Long.valueOf(userIdObj.toString());
        }
        return null;
    }

    private Claims parseToken(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
