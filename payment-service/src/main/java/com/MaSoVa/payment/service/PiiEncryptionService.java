package com.MaSoVa.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for encrypting/decrypting PII data at rest.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * GDPR Compliance: This service helps satisfy GDPR Article 32 requirements
 * for appropriate technical measures to protect personal data.
 *
 * Renamed from EncryptionService to PiiEncryptionService to avoid Spring bean name conflicts.
 */
@Service
public class PiiEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(PiiEncryptionService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKeySpec secretKey;

    public PiiEncryptionService(
            @Value("${masova.encryption.key:#{null}}") String encryptionKey,
            @Value("${spring.profiles.active:default}") String activeProfile) {

        if (encryptionKey == null || encryptionKey.isEmpty()) {
            // Allow dev/test profiles to use a default key, but fail in production
            if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
                throw new IllegalStateException(
                    "SECURITY ERROR: No encryption key configured in production! " +
                    "Set MASOVA_ENCRYPTION_KEY environment variable.");
            }
            log.warn("SECURITY WARNING: No encryption key configured. Using default key for development. " +
                    "Set MASOVA_ENCRYPTION_KEY environment variable in production!");
            // Default key for development only - 32 bytes for AES-256
            encryptionKey = "MaSoVa-Dev-Only-32ByteSecretKey!";
        }

        // Ensure key is exactly 32 bytes for AES-256
        byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        this.secretKey = new SecretKeySpec(key32, "AES");
    }

    /**
     * Encrypts a plaintext string using AES-256-GCM.
     * Returns Base64-encoded string: IV + ciphertext + tag
     *
     * @param plaintext The text to encrypt
     * @return Base64-encoded encrypted string, or null if input is null
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            // Encrypt
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV + ciphertext
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypts a Base64-encoded encrypted string.
     *
     * @param encryptedText Base64-encoded encrypted string (IV + ciphertext + tag)
     * @return Decrypted plaintext, or null if input is null
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }

        try {
            // Decode from Base64
            byte[] combined = Base64.getDecoder().decode(encryptedText);

            // Extract IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);

            // Extract ciphertext
            byte[] ciphertext = new byte[combined.length - iv.length];
            System.arraycopy(combined, iv.length, ciphertext, 0, ciphertext.length);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            // Decrypt
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            // Not encrypted (legacy data) - return as-is
            log.debug("Data appears to be unencrypted (legacy), returning as-is");
            return encryptedText;
        } catch (Exception e) {
            log.error("Decryption failed - data may be corrupted or using wrong key", e);
            // Return original if decryption fails (for backwards compatibility with unencrypted data)
            return encryptedText;
        }
    }

    /**
     * Checks if a string appears to be encrypted (Base64 encoded with proper length)
     */
    public boolean isEncrypted(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            // Minimum length: IV (12) + 1 byte data + tag (16)
            return decoded.length >= GCM_IV_LENGTH + 17;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
