package com.plantcare_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // tắt CSRF cho API.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll() // cho phép truy cập các endpoint auth.
                        .requestMatchers("/api/admin/**").permitAll()
                        .requestMatchers("/api/user/**").permitAll()// cho phép truy cập các endpoint admin.
                        .requestMatchers("/api/plants/**").permitAll()
                        .requestMatchers("/api/user_plants/**").permitAll()// cho phép truy cập các endpoint plants (tìm
                                                                       // kiếm cây).
                        .anyRequest().authenticated() // các endpoint khác yêu cầu xác thực.
                );
        return http.build();
    }
}
