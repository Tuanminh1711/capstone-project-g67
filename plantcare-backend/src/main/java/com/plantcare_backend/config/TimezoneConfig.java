package com.plantcare_backend.config;

import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@Configuration
public class TimezoneConfig {

    @PostConstruct
    public void init() {
        // Set default timezone to Asia/Ho_Chi_Minh
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }
}