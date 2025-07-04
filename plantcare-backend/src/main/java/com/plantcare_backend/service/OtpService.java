package com.plantcare_backend.service;

public interface OtpService {
    void generateAndSendOtp(String email, String type);

    boolean verifyOtp(String email, String otp);
}