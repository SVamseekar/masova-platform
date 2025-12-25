package com.MaSoVa.shared.validation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Comprehensive input validation utility
 * Phase 14: Security Hardening - Input validation
 */
@Component
public class InputValidator {

    private static final Logger logger = LoggerFactory.getLogger(InputValidator.class);

    // Regex patterns for validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$"
    );

    private static final Pattern USERNAME_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_-]{3,20}$"
    );

    private static final Pattern ALPHANUMERIC_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9\\s]+$"
    );

    // XSS prevention patterns
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(<script.*?>.*?</script>)|(<.*?javascript:.*?>)|(onerror=)|(onload=)|(onclick=)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // SQL injection prevention patterns
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(')|(--)|(;)|(\\bor\\b)|(\\band\\b)|(\\bunion\\b)|(\\bselect\\b)|(\\bdrop\\b)|(\\binsert\\b)|(\\bupdate\\b)|(\\bdelete\\b)",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Validate email address
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Validate phone number
     */
    public boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }

    /**
     * Validate username
     */
    public boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }
        return USERNAME_PATTERN.matcher(username.trim()).matches();
    }

    /**
     * Validate alphanumeric input
     */
    public boolean isAlphanumeric(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        return ALPHANUMERIC_PATTERN.matcher(input.trim()).matches();
    }

    /**
     * Check for XSS attacks
     */
    public boolean containsXSS(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        boolean hasXSS = XSS_PATTERN.matcher(input).find();
        if (hasXSS) {
            logger.warn("XSS attempt detected: {}", sanitizeForLogging(input));
        }
        return hasXSS;
    }

    /**
     * Check for SQL injection attempts
     */
    public boolean containsSQLInjection(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        boolean hasSQLInjection = SQL_INJECTION_PATTERN.matcher(input).find();
        if (hasSQLInjection) {
            logger.warn("SQL injection attempt detected: {}", sanitizeForLogging(input));
        }
        return hasSQLInjection;
    }

    /**
     * Sanitize string for XSS prevention
     */
    public String sanitizeXSS(String input) {
        if (input == null) {
            return null;
        }

        String sanitized = input;
        sanitized = sanitized.replaceAll("<", "&lt;");
        sanitized = sanitized.replaceAll(">", "&gt;");
        sanitized = sanitized.replaceAll("\"", "&quot;");
        sanitized = sanitized.replaceAll("'", "&#x27;");
        sanitized = sanitized.replaceAll("/", "&#x2F;");
        sanitized = sanitized.replaceAll("\\(", "&#40;");
        sanitized = sanitized.replaceAll("\\)", "&#41;");

        return sanitized;
    }

    /**
     * Validate string length
     */
    public boolean isValidLength(String input, int minLength, int maxLength) {
        if (input == null) {
            return false;
        }
        int length = input.trim().length();
        return length >= minLength && length <= maxLength;
    }

    /**
     * Validate password strength
     */
    public PasswordStrength checkPasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return PasswordStrength.WEAK;
        }

        int score = 0;

        // Length check
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;

        // Contains lowercase
        if (password.matches(".*[a-z].*")) score++;

        // Contains uppercase
        if (password.matches(".*[A-Z].*")) score++;

        // Contains digit
        if (password.matches(".*\\d.*")) score++;

        // Contains special character
        if (password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) score++;

        if (score <= 2) return PasswordStrength.WEAK;
        if (score <= 4) return PasswordStrength.MEDIUM;
        return PasswordStrength.STRONG;
    }

    /**
     * Validate numeric input
     */
    public boolean isValidNumber(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        try {
            Double.parseDouble(input.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Validate integer input
     */
    public boolean isValidInteger(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        try {
            Integer.parseInt(input.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Validate positive number
     */
    public boolean isPositiveNumber(String input) {
        if (!isValidNumber(input)) {
            return false;
        }
        return Double.parseDouble(input.trim()) > 0;
    }

    /**
     * Sanitize input for logging (prevent log injection)
     */
    private String sanitizeForLogging(String input) {
        if (input == null) {
            return "null";
        }
        return input.replaceAll("[\\r\\n]", "_").substring(0, Math.min(input.length(), 100));
    }

    /**
     * Validate URL format
     */
    public boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        try {
            java.net.URI.create(url).toURL();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public enum PasswordStrength {
        WEAK,
        MEDIUM,
        STRONG
    }
}
