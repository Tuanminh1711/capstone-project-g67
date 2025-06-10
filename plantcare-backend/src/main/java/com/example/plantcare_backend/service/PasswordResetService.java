package com.example.plantcare_backend.service;

public interface PasswordResetService {
    void createPasswordResetToken(String email);
    boolean validateResetCode(String email, String code);
    void resetPassword(String email, String code, String newPassword);
}
