package com.MaSoVa.shared.util;

/**
 * Utility class for masking Personally Identifiable Information (PII) in logs.
 * This helps ensure GDPR compliance by preventing PII exposure in application logs.
 *
 * GDPR Article 32 requires appropriate security measures including pseudonymization
 * and encryption of personal data. Logging masked PII is a best practice.
 */
public final class PiiMasker {

    private PiiMasker() {
        // Utility class - prevent instantiation
    }

    /**
     * Masks an email address for safe logging.
     * Example: "john.doe@example.com" -> "j***@example.com"
     *
     * @param email The email address to mask
     * @return The masked email or "***" if null/invalid
     */
    public static String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "***";
        }

        if (!email.contains("@")) {
            // Not a valid email format, mask entirely
            return mask(email, 1);
        }

        String[] parts = email.split("@", 2);
        String localPart = parts[0];
        String domain = parts[1];

        if (localPart.length() <= 1) {
            return "***@" + domain;
        }

        // Show first character + mask + domain
        return localPart.charAt(0) + "***@" + domain;
    }

    /**
     * Masks a phone number for safe logging.
     * Example: "+1234567890" -> "***7890"
     *
     * @param phone The phone number to mask
     * @return The masked phone or "***" if null/invalid
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return "***";
        }

        // Remove any non-digit characters for length check
        String digitsOnly = phone.replaceAll("[^0-9]", "");

        if (digitsOnly.length() < 4) {
            return "***";
        }

        // Show last 4 digits only
        return "***" + phone.substring(phone.length() - 4);
    }

    /**
     * Masks a name for safe logging.
     * Example: "John Doe" -> "J*** D***"
     *
     * @param name The name to mask
     * @return The masked name or "***" if null/invalid
     */
    public static String maskName(String name) {
        if (name == null || name.isEmpty()) {
            return "***";
        }

        String[] parts = name.trim().split("\\s+");
        StringBuilder masked = new StringBuilder();

        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                masked.append(" ");
            }
            masked.append(mask(parts[i], 1));
        }

        return masked.toString();
    }

    /**
     * Masks a credit card number for safe logging.
     * Example: "4111111111111111" -> "***1111"
     *
     * @param cardNumber The card number to mask
     * @return The masked card number or "***" if null/invalid
     */
    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.isEmpty()) {
            return "***";
        }

        String digitsOnly = cardNumber.replaceAll("[^0-9]", "");

        if (digitsOnly.length() < 4) {
            return "***";
        }

        // Show last 4 digits only
        return "***" + digitsOnly.substring(digitsOnly.length() - 4);
    }

    /**
     * Masks an address for safe logging.
     * Example: "123 Main St, City" -> "1** M*** S*, C***"
     *
     * @param address The address to mask
     * @return The masked address or "***" if null/invalid
     */
    public static String maskAddress(String address) {
        if (address == null || address.isEmpty()) {
            return "***";
        }

        // Just show first character of each word
        String[] words = address.split("\\s+");
        StringBuilder masked = new StringBuilder();

        for (int i = 0; i < words.length; i++) {
            if (i > 0) {
                masked.append(" ");
            }

            String word = words[i];
            if (word.length() > 0) {
                masked.append(word.charAt(0));
                if (word.length() > 1) {
                    masked.append("***");
                }
            }
        }

        return masked.toString();
    }

    /**
     * Masks an IP address for safe logging.
     * Example: "192.168.1.100" -> "192.168.***"
     *
     * @param ipAddress The IP address to mask
     * @return The masked IP or "***" if null/invalid
     */
    public static String maskIpAddress(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return "***";
        }

        // IPv4
        if (ipAddress.contains(".")) {
            String[] octets = ipAddress.split("\\.");
            if (octets.length >= 2) {
                return octets[0] + "." + octets[1] + ".***";
            }
        }

        // IPv6 - just show first segment
        if (ipAddress.contains(":")) {
            int firstColon = ipAddress.indexOf(":");
            if (firstColon > 0) {
                return ipAddress.substring(0, firstColon) + ":***";
            }
        }

        return "***";
    }

    /**
     * Masks an ID (user ID, resource ID, etc.) for safe logging.
     * Example: "507f1f77bcf86cd799439011" -> "507f***9011"
     *
     * @param id The ID to mask
     * @return The masked ID or "***" if null/invalid
     */
    public static String maskId(String id) {
        if (id == null || id.isEmpty()) {
            return "***";
        }

        if (id.length() <= 8) {
            return mask(id, 2);
        }

        // Show first 4 and last 4 characters for IDs
        return mask(id, 4, 4);
    }

    /**
     * Generic masking utility - shows first N characters and masks the rest.
     *
     * @param value The value to mask
     * @param showFirst Number of characters to show at start
     * @return The masked value
     */
    public static String mask(String value, int showFirst) {
        if (value == null || value.isEmpty()) {
            return "***";
        }

        if (value.length() <= showFirst) {
            return "***";
        }

        return value.substring(0, showFirst) + "***";
    }

    /**
     * Generic masking utility - shows first and last N characters.
     *
     * @param value The value to mask
     * @param showFirst Number of characters to show at start
     * @param showLast Number of characters to show at end
     * @return The masked value
     */
    public static String mask(String value, int showFirst, int showLast) {
        if (value == null || value.isEmpty()) {
            return "***";
        }

        if (value.length() <= showFirst + showLast) {
            return "***";
        }

        return value.substring(0, showFirst) + "***" + value.substring(value.length() - showLast);
    }
}
