package com.plantcare_backend.dto.validator;

public class ValidationUtils {
    public static boolean containsSpamKeywords(String text) {
        if (text == null) return false;

        String lowerText = text.toLowerCase();
        return ValidationConstants.SPAM_KEYWORDS.stream()
                .anyMatch(lowerText::contains);
    }

    public static boolean isValidScientificName(String scientificName) {
        if (scientificName == null || scientificName.trim().isEmpty()) {
            return false;
        }

        // Kiểm tra format: Genus species
        return scientificName.matches("^[A-Z][a-z]+\\s+[a-z]+(?:-[a-z]+)*$");
    }

    public static boolean isValidCommonName(String commonName) {
        if (commonName == null || commonName.trim().isEmpty()) {
            return false;
        }

        // Kiểm tra ký tự hợp lệ
        return commonName.matches("^[a-zA-ZÀ-ỹ0-9\\s\\-']+$");
    }

    public static boolean containsHtmlTags(String text) {
        if (text == null) return false;
        return text.contains("<") || text.contains(">");
    }

    public static boolean isLengthInRange(String text, int min, int max) {
        if (text == null) return false;
        int length = text.trim().length();
        return length >= min && length <= max;
    }
}
