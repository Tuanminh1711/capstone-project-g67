package com.plantcare_backend.dto.validator;

import org.springframework.stereotype.Component;

@Component
public class PasswordStrengthValidator {
    public boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasSpecial = password.matches(".*[@#$%^&+=!].*");
        boolean noWhitespace = !password.contains(" ");

        return hasDigit && hasLower && hasUpper && hasSpecial && noWhitespace;
    }

    public String getPasswordStrengthMessage(String password) {
        if (password == null) return "Password cannot be null";
        if (password.length() < 8) return "Password must be at least 8 characters";
        if (!password.matches(".*\\d.*")) return "Password must contain at least one number";
        if (!password.matches(".*[a-z].*")) return "Password must contain at least one lowercase letter";
        if (!password.matches(".*[A-Z].*")) return "Password must contain at least one uppercase letter";
        if (!password.matches(".*[@#$%^&+=!].*"))
            return "Password must contain at least one special character (@#$%^&+=!)";
        if (password.contains(" ")) return "Password cannot contain spaces";

        return "Password is strong";
    }
}
