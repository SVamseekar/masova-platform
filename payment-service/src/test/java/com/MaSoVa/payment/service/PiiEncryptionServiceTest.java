package com.MaSoVa.payment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PiiEncryptionService Unit Tests")
class PiiEncryptionServiceTest {

    private PiiEncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        encryptionService = new PiiEncryptionService(
                "TestEncryptionKey-32ByteLongKey!", "dev");
    }

    @Nested
    @DisplayName("encrypt")
    class EncryptTests {

        @Test
        @DisplayName("Should encrypt plaintext and return Base64-encoded string")
        void shouldEncryptPlaintext() {
            // Given
            String plaintext = "customer@example.com";

            // When
            String encrypted = encryptionService.encrypt(plaintext);

            // Then
            assertThat(encrypted).isNotNull();
            assertThat(encrypted).isNotEqualTo(plaintext);
            assertThat(encrypted).isNotEmpty();
        }

        @Test
        @DisplayName("Should return null when input is null")
        void shouldReturnNullWhenInputIsNull() {
            // When
            String result = encryptionService.encrypt(null);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return empty string when input is empty")
        void shouldReturnEmptyStringWhenInputIsEmpty() {
            // When
            String result = encryptionService.encrypt("");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should produce different ciphertexts for same plaintext (random IV)")
        void shouldProduceDifferentCiphertextsForSamePlaintext() {
            // Given
            String plaintext = "+31612345678";

            // When
            String encrypted1 = encryptionService.encrypt(plaintext);
            String encrypted2 = encryptionService.encrypt(plaintext);

            // Then
            assertThat(encrypted1).isNotEqualTo(encrypted2);
        }
    }

    @Nested
    @DisplayName("decrypt")
    class DecryptTests {

        @Test
        @DisplayName("Should decrypt encrypted text back to original plaintext")
        void shouldDecryptToOriginalPlaintext() {
            // Given
            String plaintext = "customer@example.com";
            String encrypted = encryptionService.encrypt(plaintext);

            // When
            String decrypted = encryptionService.decrypt(encrypted);

            // Then
            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Should return null when input is null")
        void shouldReturnNullWhenInputIsNull() {
            // When
            String result = encryptionService.decrypt(null);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return empty string when input is empty")
        void shouldReturnEmptyStringWhenInputIsEmpty() {
            // When
            String result = encryptionService.decrypt("");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return original text for non-encrypted legacy data")
        void shouldReturnOriginalTextForLegacyData() {
            // Given - plain text that is not Base64 / not encrypted
            String legacyData = "plaintext-not-encrypted";

            // When
            String result = encryptionService.decrypt(legacyData);

            // Then - returns as-is for backwards compatibility
            assertThat(result).isEqualTo(legacyData);
        }

        @Test
        @DisplayName("Should handle special characters in plaintext")
        void shouldHandleSpecialCharacters() {
            // Given
            String plaintext = "user+test@sub.domain.com";

            // When
            String encrypted = encryptionService.encrypt(plaintext);
            String decrypted = encryptionService.decrypt(encrypted);

            // Then
            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Should handle unicode characters in plaintext")
        void shouldHandleUnicodeCharacters() {
            // Given
            String plaintext = "Name with accents: Rene Muller";

            // When
            String encrypted = encryptionService.encrypt(plaintext);
            String decrypted = encryptionService.decrypt(encrypted);

            // Then
            assertThat(decrypted).isEqualTo(plaintext);
        }
    }

    @Nested
    @DisplayName("isEncrypted")
    class IsEncryptedTests {

        @Test
        @DisplayName("Should return true for encrypted value")
        void shouldReturnTrueForEncryptedValue() {
            // Given
            String encrypted = encryptionService.encrypt("test@example.com");

            // When
            boolean result = encryptionService.isEncrypted(encrypted);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false for plain text value")
        void shouldReturnFalseForPlainText() {
            // When
            boolean result = encryptionService.isEncrypted("just-plain-text");

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false for null value")
        void shouldReturnFalseForNull() {
            // When
            boolean result = encryptionService.isEncrypted(null);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false for empty string")
        void shouldReturnFalseForEmptyString() {
            // When
            boolean result = encryptionService.isEncrypted("");

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("Constructor / Key Configuration")
    class ConstructorTests {

        @Test
        @DisplayName("Should use default key when no key configured in dev profile")
        void shouldUseDefaultKeyInDevProfile() {
            // Given / When
            PiiEncryptionService devService = new PiiEncryptionService(null, "dev");

            // Then - should work without throwing
            String encrypted = devService.encrypt("test");
            String decrypted = devService.decrypt(encrypted);
            assertThat(decrypted).isEqualTo("test");
        }

        @Test
        @DisplayName("Should throw in production when no encryption key configured")
        void shouldThrowInProductionWithoutKey() {
            // When / Then
            assertThatThrownBy(() -> new PiiEncryptionService(null, "prod"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("SECURITY ERROR");
        }

        @Test
        @DisplayName("Should throw in production profile variant when no key configured")
        void shouldThrowInProductionVariantWithoutKey() {
            // When / Then
            assertThatThrownBy(() -> new PiiEncryptionService("", "production"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("SECURITY ERROR");
        }
    }
}
