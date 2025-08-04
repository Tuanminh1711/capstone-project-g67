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

        String requestURI = request.getRequestURI();

        // Skip JWT validation for public endpoints
        if (isPublicEndpoint(requestURI)) {
            System.out.println("JWT Filter: Skipping public endpoint: " + requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        // Get JWT token from Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("JWT Filter: No valid Authorization header for: " + requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Remove "Bearer " prefix

        try {
            // Validate JWT token
            if (jwtUtil.validateToken(token)) {
                // Extract user information
                Long userId = jwtUtil.getUserIdFromToken(token);
                String username = jwtUtil.getUsernameFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);

                // Set user information in request attributes
                request.setAttribute("userId", userId);
                request.setAttribute("username", username);
                request.setAttribute("role", role);

                // Set authentication context
                List<GrantedAuthority> authorities = List.of(() -> "ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username,
                        null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("JWT Filter: Valid token for user: " + username + " (ID: " + userId + ")");
            } else {
                System.out.println("JWT Filter: Invalid token for: " + requestURI);
            }
        } catch (Exception e) {
            System.out.println("JWT Filter: Error processing token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI) {
        // Define public endpoints that don't need JWT validation
        return requestURI.startsWith("/api/auth/") ||
                requestURI.startsWith("/api/plants/") ||
                requestURI.startsWith("/api/swagger-ui/") ||
                requestURI.startsWith("/api/v3/api-docs") ||
                requestURI.startsWith("/api/swagger-resources/") ||
                requestURI.startsWith("/api/webjars/") ||
                requestURI.startsWith("/api/ws-chat/") ||
                requestURI.startsWith("/api/payment/vnpay-return") ||
                requestURI.startsWith("/api/payment/vnpay-ipn") ||
                requestURI.startsWith("/api/payment/vnpay/create");
    }
}