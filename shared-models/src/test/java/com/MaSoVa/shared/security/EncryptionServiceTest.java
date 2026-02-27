package com.MaSoVa.shared.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.lang.reflect.Field;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("EncryptionService")
class EncryptionServiceTest {

    private EncryptionService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new EncryptionService();

        // Generate a valid AES-256 key and set it via reflection
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();
        String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());

        setField(service, "encryptionKeyBase64", base64Key);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ---- Encrypt/Decrypt round-trip ----

    @Nested
    @DisplayName("Encrypt and decrypt round-trip")
    class EncryptDecryptRoundTrip {

        @Test
        @DisplayName("Should encrypt and decrypt plain text correctly")
        void shouldRoundTrip_plainText() {
            String original = "Hello, World!";
            String encrypted = service.encrypt(original);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(original);
        }

        @Test
        @DisplayName("Should encrypt and decrypt special characters")
        void shouldRoundTrip_specialCharacters() {
            String original = "P@ssw0rd! with spaces & symbols #$%^";
            String encrypted = service.encrypt(original);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(original);
        }

        @Test
        @DisplayName("Should encrypt and decrypt unicode text")
        void shouldRoundTrip_unicode() {
            String original = "Bonjour le monde! Hallo Wereld! Hej Varld!";
            String encrypted = service.encrypt(original);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(original);
        }

        @Test
        @DisplayName("Should encrypt and decrypt a long string")
        void shouldRoundTrip_longString() {
            String original = "A".repeat(10_000);
            String encrypted = service.encrypt(original);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(original);
        }

        @Test
        @DisplayName("Should produce different ciphertext for same plaintext (random IV)")
        void shouldProduceDifferentCiphertext_forSamePlaintext() {
            String original = "Same text";
            String encrypted1 = service.encrypt(original);
            String encrypted2 = service.encrypt(original);

            assertThat(encrypted1).isNotEqualTo(encrypted2);
        }
    }

    // ---- Null and empty handling ----

    @Nested
    @DisplayName("Null and empty input handling")
    class NullAndEmptyHandling {

        @Test
        @DisplayName("Should return null when encrypting null")
        void shouldReturnNull_forNullEncrypt() {
            assertThat(service.encrypt(null)).isNull();
        }

        @Test
        @DisplayName("Should return empty when encrypting empty string")
        void shouldReturnEmpty_forEmptyEncrypt() {
            assertThat(service.encrypt("")).isEmpty();
        }

        @Test
        @DisplayName("Should return null when decrypting null")
        void shouldReturnNull_forNullDecrypt() {
            assertThat(service.decrypt(null)).isNull();
        }

        @Test
        @DisplayName("Should return empty when decrypting empty string")
        void shouldReturnEmpty_forEmptyDecrypt() {
            assertThat(service.decrypt("")).isEmpty();
        }
    }

    // ---- Decryption error handling ----

    @Nested
    @DisplayName("Decryption error scenarios")
    class DecryptionErrors {

        @Test
        @DisplayName("Should throw RuntimeException when decrypting invalid Base64")
        void shouldThrow_forInvalidBase64() {
            assertThatThrownBy(() -> service.decrypt("not-valid-base64!!!"))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should throw RuntimeException when decrypting tampered ciphertext")
        void shouldThrow_forTamperedCiphertext() {
            String encrypted = service.encrypt("secret data");
            // Tamper with the ciphertext by modifying a character
            byte[] decoded = Base64.getDecoder().decode(encrypted);
            decoded[decoded.length - 1] ^= 0xFF;
            String tampered = Base64.getEncoder().encodeToString(decoded);

            assertThatThrownBy(() -> service.decrypt(tampered))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Decryption failed");
        }
    }

    // ---- Key initialization ----

    @Nested
    @DisplayName("Key initialization")
    class KeyInitialization {

        @Test
        @DisplayName("Should generate a temporary key when no key is configured")
        void shouldGenerateTempKey_whenNoKeyConfigured() throws Exception {
            EncryptionService noKeyService = new EncryptionService();
            setField(noKeyService, "encryptionKeyBase64", "");

            // Should still work (generates a temp key)
            String encrypted = noKeyService.encrypt("test");
            String decrypted = noKeyService.decrypt(encrypted);
            assertThat(decrypted).isEqualTo("test");
        }

        @Test
        @DisplayName("Should throw when configured key is invalid Base64")
        void shouldThrow_forInvalidKeyBase64() throws Exception {
            EncryptionService badKeyService = new EncryptionService();
            setField(badKeyService, "encryptionKeyBase64", "not-valid-base64!!!");

            assertThatThrownBy(() -> badKeyService.encrypt("test"))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    // ---- Data masking helpers ----

    @Nested
    @DisplayName("Data masking helper methods")
    class DataMasking {

        @Test
        @DisplayName("maskData should show only last N visible characters")
        void shouldMaskData_showingLastChars() {
            String result = service.maskData("1234567890", 4);
            assertThat(result).isEqualTo("******7890");
        }

        @Test
        @DisplayName("maskData should return original when shorter than visible chars")
        void shouldReturnOriginal_whenShorterThanVisible() {
            assertThat(service.maskData("hi", 5)).isEqualTo("hi");
        }

        @Test
        @DisplayName("maskData should return null for null input")
        void shouldReturnNull_forNullInput() {
            assertThat(service.maskData(null, 4)).isNull();
        }

        @Test
        @DisplayName("maskEmail should mask username keeping first and last char")
        void shouldMaskEmail() {
            String result = service.maskEmail("john.doe@example.com");
            assertThat(result).startsWith("j");
            assertThat(result).contains("@example.com");
            assertThat(result).endsWith("@example.com");
        }

        @Test
        @DisplayName("maskEmail should mask short username as **@domain")
        void shouldMaskShortEmailUsername() {
            String result = service.maskEmail("jd@example.com");
            assertThat(result).isEqualTo("**@example.com");
        }

        @Test
        @DisplayName("maskEmail should return null for null input")
        void shouldReturnNull_forNullEmail() {
            assertThat(service.maskEmail(null)).isNull();
        }

        @Test
        @DisplayName("maskPhoneNumber should show only last 4 digits")
        void shouldMaskPhoneNumber() {
            String result = service.maskPhoneNumber("+31612345678");
            assertThat(result).endsWith("5678");
            assertThat(result).startsWith("*");
        }

        @Test
        @DisplayName("maskPhoneNumber should return null for null phone")
        void shouldReturnNull_forNullPhone() {
            assertThat(service.maskPhoneNumber(null)).isNull();
        }

        @Test
        @DisplayName("maskPhoneNumber should return short phone as-is")
        void shouldReturnShortPhone_asIs() {
            assertThat(service.maskPhoneNumber("12")).isEqualTo("12");
        }

        @Test
        @DisplayName("maskCreditCard should show only last 4 digits")
        void shouldMaskCreditCard() {
            String result = service.maskCreditCard("4111111111111111");
            assertThat(result).isEqualTo("************1111");
        }

        @Test
        @DisplayName("maskCreditCard should return null for null card")
        void shouldReturnNull_forNullCard() {
            assertThat(service.maskCreditCard(null)).isNull();
        }
    }

    // ---- Secure token generation ----

    @Nested
    @DisplayName("Secure token generation")
    class SecureTokenGeneration {

        @Test
        @DisplayName("Should generate a non-empty Base64 URL-safe token")
        void shouldGenerateNonEmptyToken() {
            String token = service.generateSecureToken(32);
            assertThat(token).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Should generate unique tokens on each call")
        void shouldGenerateUniqueTokens() {
            String token1 = service.generateSecureToken(32);
            String token2 = service.generateSecureToken(32);
            assertThat(token1).isNotEqualTo(token2);
        }
    }

    // ---- Hashing ----

    @Nested
    @DisplayName("Data hashing")
    class DataHashing {

        @Test
        @DisplayName("Should produce consistent hash for same input")
        void shouldProduceConsistentHash() {
            String hash1 = service.hashData("test input");
            String hash2 = service.hashData("test input");
            assertThat(hash1).isEqualTo(hash2);
        }

        @Test
        @DisplayName("Should produce different hashes for different inputs")
        void shouldProduceDifferentHashes() {
            String hash1 = service.hashData("input one");
            String hash2 = service.hashData("input two");
            assertThat(hash1).isNotEqualTo(hash2);
        }

        @Test
        @DisplayName("Should produce a valid Base64-encoded hash")
        void shouldProduceBase64Hash() {
            String hash = service.hashData("test");
            // Should not throw on decode
            byte[] decoded = Base64.getDecoder().decode(hash);
            // SHA-256 produces 32 bytes
            assertThat(decoded).hasSize(32);
        }
    }
}
