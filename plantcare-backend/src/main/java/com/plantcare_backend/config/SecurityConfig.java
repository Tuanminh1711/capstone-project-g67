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
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/forgot-password",
                                "/api/auth/verify-reset-code",
                                "/api/auth/reset-password",
                                "/api/auth/change-password",
                                "/api/auth/resend-verification",
                                "/api/auth/verify-email",
                                "/api/auth/login-expert",
                                "/api/auth/login-admin")
                        .permitAll()
                        .requestMatchers("/api/admin/**").permitAll()
                        .requestMatchers("/api/plants/**").permitAll()
                        .requestMatchers("/api/users/**").permitAll()
                        .requestMatchers("/api/manager/**").permitAll()
                        .requestMatchers("/api/support/**").authenticated()
                        .requestMatchers("/api/admin/support/**").authenticated()
                        .requestMatchers("/api/user-plants/**").permitAll()
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers("/chat/**").permitAll()
                        .requestMatchers("/api/plant-care/").authenticated()
                        .requestMatchers("/api/personal/**").authenticated()
                        .requestMatchers("/api/avatars/**").permitAll()
                        // VNPAY
                        .requestMatchers("/api/payment/vnpay-return").permitAll()
                        .requestMatchers("/api/payment/vnpay-ipn").permitAll()
                        .requestMatchers("/api/payment/vnpay/create").permitAll()
                        .requestMatchers("/ws-chat/**", "/ws-chat", "/ws-chat/websocket")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "http://40.81.23.51"
                // Thêm domain nếu có, ví dụ: "https://yourdomain.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/chat/**", config);
        return source;
    }

}