package com.plantcare_backend.config;

import com.plantcare_backend.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {
                })
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/login",
                                "/auth/register",
                                "/auth/forgot-password",
                                "/auth/verify-reset-code",
                                "/auth/reset-password",
                                "/auth/change-password",
                                "/auth/resend-verification",
                                "/auth/verify-email",
                                "/auth/login-admin",
                                "/auth/login-expert")
                        .permitAll()
                        .requestMatchers("/admin/**").permitAll()
                        .requestMatchers("/plants/**", "/plants/categories",
                                "/plants/search")
                        .permitAll()
                        .requestMatchers("/users/**").permitAll()
                        .requestMatchers("/manager/**").permitAll()
                        .requestMatchers("/user-plants/**").permitAll()
                        .requestMatchers("/support/**").authenticated()
                        .requestMatchers("/admin/support/**").authenticated()
                        .requestMatchers("/user-plants/**").permitAll()
                        .requestMatchers("/plant-care/").authenticated()
                        .requestMatchers("/personal/**").authenticated()
                        .requestMatchers("/avatars/**").permitAll()
                        .requestMatchers("/ai/**").authenticated()
                        // VNPAY Payment endpoints
                        .requestMatchers("/payment/vnpay-return").permitAll()
                        .requestMatchers("/payment/vnpay-ipn").permitAll()
                        .requestMatchers("/payment/vnpay/create").permitAll()
                        .requestMatchers("/api/vip/disease-detection/**").authenticated()
                        // Chat endpoints - authenticated for VIP/Expert access
                        .requestMatchers("/chat/**").authenticated()
                        // WebSocket endpoints - permit all for WebSocket handshake
                        .requestMatchers("/ws/**", "/ws", "/ws/websocket")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**")
                        .permitAll()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "http://40.81.23.51",
                "https://plantcare.id.vn",
                "https://www.plantcare.id.vn",
                "http://plantcare.id.vn",
                "http://www.plantcare.id.vn"));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}