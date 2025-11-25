package com.MaSoVa.shared.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Encryption service for PII and sensitive data
 * Phase 14: Security Hardening - Data encryption
 */
@Service
public class EncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionService.class);

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int KEY_SIZE = 256;
    private static final int IV_SIZE = 12;
    private static final int TAG_SIZE = 128;

    @Value("${security.encryption.key:}")
    private String encryptionKeyBase64;

    private SecretKey secretKey;

    /**
     * Initialize encryption key
     */
    private SecretKey getSecretKey() {
        if (secretKey == null) {
            try {
                if (encryptionKeyBase64 != null && !encryptionKeyBase64.isEmpty()) {
                    byte[] decodedKey = Base64.getDecoder().decode(encryptionKeyBase64);
                    secretKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, "AES");
                } else {
                    // Generate a new key if not provided (for development only)
                    KeyGenerator keyGen = KeyGenerator.getInstance("AES");
                    keyGen.init(KEY_SIZE);
                    secretKey = keyGen.generateKey();
                    logger.warn("No encryption key configured. Generated temporary key (DO NOT USE IN PRODUCTION)");
                }
            } catch (Exception e) {
                logger.error("Error initializing encryption key", e);
                throw new RuntimeException("Failed to initialize encryption", e);
            }
        }
        return secretKey;
    }

    /**
     * Encrypt data
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            // Generate IV
            byte[] iv = new byte[IV_SIZE];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Encrypt
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_SIZE, iv);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] encryptedData = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV and encrypted data
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedData.length);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedData);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            logger.error("Error encrypting data", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt data
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }

        try {
            byte[] encryptedData = Base64.getDecoder().decode(encryptedText);

            // Extract IV and encrypted data
            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedData);
            byte[] iv = new byte[IV_SIZE];
            byteBuffer.get(iv);
            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            // Decrypt
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_SIZE, iv);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] decryptedData = cipher.doFinal(cipherText);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Error decrypting data", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Mask sensitive data for display
     */
    public String maskData(String data, int visibleChars) {
        if (data == null || data.length() <= visibleChars) {
            return data;
        }

        int maskLength = data.length() - visibleChars;
        String masked = "*".repeat(maskLength);
        return masked + data.substring(maskLength);
    }

    /**
     * Mask email address
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }

        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        if (username.length() <= 2) {
            return "**@" + domain;
        }

        return username.charAt(0) + "*".repeat(username.length() - 2) + username.charAt(username.length() - 1) + "@" + domain;
    }

    /**
     * Mask phone number
     */
    public String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }

        return "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4);
    }

    /**
     * Mask credit card number
     */
    public String maskCreditCard(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return cardNumber;
        }

        return "*".repeat(cardNumber.length() - 4) + cardNumber.substring(cardNumber.length() - 4);
    }

    /**
     * Generate secure random token
     */
    public String generateSecureToken(int length) {
        byte[] randomBytes = new byte[length];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Hash sensitive data (one-way)
     */
    public String hashData(String data) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            logger.error("Error hashing data", e);
            throw new RuntimeException("Hashing failed", e);
        }
    }
}
