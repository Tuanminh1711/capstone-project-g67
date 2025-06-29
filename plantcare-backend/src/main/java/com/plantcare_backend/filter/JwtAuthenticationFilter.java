package com.plantcare_backend.filter;

import com.plantcare_backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * create by Tahoang
 */

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("JWT Filter is running for: " + request.getRequestURI());

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String jwtToken = authorizationHeader.substring(7);
            System.out.println("jwtToken: " + jwtToken);
            try {
                System.out.println("Is token blacklisted? " + jwtUtil.isTokenBlacklisted(jwtToken));
                System.out.println("Is token valid? " + jwtUtil.validateToken(jwtToken));
                // Kiểm tra token có bị thu hồi không
                if (jwtUtil.isTokenBlacklisted(jwtToken)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token revoked");
                    return;
                }
                // Kiểm tra token hợp lệ
                if (jwtUtil.validateToken(jwtToken)) {
                    Integer userId = jwtUtil.getUserIdFromToken(jwtToken);
                    System.out.println("userId from token: " + userId);
                    List<GrantedAuthority> authorities = jwtUtil.getAuthoritiesFromToken(jwtToken);
                    // Đặt authentication vào context
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    // Đặt thông tin user vào request attribute
                    request.setAttribute("userId", userId);
                } else {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
                    return;
                }
            } catch (Exception e) {
                System.out.println("Exception in filter: " + e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token verification failed");
                return;
            }
        }
        // Tiếp tục filter chain
        filterChain.doFilter(request, response);
    }
}