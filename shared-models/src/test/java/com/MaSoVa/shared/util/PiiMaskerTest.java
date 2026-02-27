package com.MaSoVa.shared.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PiiMasker")
class PiiMaskerTest {

    // ---- Email masking ----

    @Nested
    @DisplayName("maskEmail")
    class MaskEmail {

        @Test
        @DisplayName("Should mask email showing first char of local part and full domain")
        void shouldMaskStandardEmail() {
            String result = PiiMasker.maskEmail("john.doe@example.com");
            assertThat(result).isEqualTo("j***@example.com");
        }

        @Test
        @DisplayName("Should mask single-character local part as ***@domain")
        void shouldMaskSingleCharLocal() {
            String result = PiiMasker.maskEmail("j@example.com");
            assertThat(result).isEqualTo("***@example.com");
        }

        @Test
        @DisplayName("Should handle email without @ symbol by masking generically")
        void shouldHandleInvalidEmail_noAt() {
            String result = PiiMasker.maskEmail("notanemail");
            assertThat(result).isEqualTo("n***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty email")
        void shouldReturnStars_forNullAndEmpty(String email) {
            assertThat(PiiMasker.maskEmail(email)).isEqualTo("***");
        }
    }

    // ---- Phone masking ----

    @Nested
    @DisplayName("maskPhone")
    class MaskPhone {

        @Test
        @DisplayName("Should show only last 4 digits of phone number")
        void shouldMaskShowingLast4Digits() {
            String result = PiiMasker.maskPhone("+1234567890");
            assertThat(result).isEqualTo("***7890");
        }

        @Test
        @DisplayName("Should return *** for phone with fewer than 4 digits")
        void shouldReturnStars_forShortPhone() {
            assertThat(PiiMasker.maskPhone("12")).isEqualTo("***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty phone")
        void shouldReturnStars_forNullAndEmpty(String phone) {
            assertThat(PiiMasker.maskPhone(phone)).isEqualTo("***");
        }

        @Test
        @DisplayName("Should handle formatted phone numbers")
        void shouldHandleFormattedPhone() {
            String result = PiiMasker.maskPhone("+31 6 1234 5678");
            assertThat(result).isEqualTo("***5678");
        }
    }

    // ---- Name masking ----

    @Nested
    @DisplayName("maskName")
    class MaskName {

        @Test
        @DisplayName("Should mask each word showing only first character")
        void shouldMaskEachWord() {
            String result = PiiMasker.maskName("John Doe");
            assertThat(result).isEqualTo("J*** D***");
        }

        @Test
        @DisplayName("Should mask single-word name")
        void shouldMaskSingleWord() {
            String result = PiiMasker.maskName("Madonna");
            assertThat(result).isEqualTo("M***");
        }

        @Test
        @DisplayName("Should handle three-part name")
        void shouldHandleThreePartName() {
            String result = PiiMasker.maskName("John James Doe");
            assertThat(result).isEqualTo("J*** J*** D***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty name")
        void shouldReturnStars_forNullAndEmpty(String name) {
            assertThat(PiiMasker.maskName(name)).isEqualTo("***");
        }
    }

    // ---- Card number masking ----

    @Nested
    @DisplayName("maskCardNumber")
    class MaskCardNumber {

        @Test
        @DisplayName("Should show only last 4 digits of card number")
        void shouldMaskShowingLast4() {
            String result = PiiMasker.maskCardNumber("4111111111111111");
            assertThat(result).isEqualTo("***1111");
        }

        @Test
        @DisplayName("Should handle formatted card number with spaces")
        void shouldHandleFormattedCard() {
            String result = PiiMasker.maskCardNumber("4111 1111 1111 1111");
            assertThat(result).isEqualTo("***1111");
        }

        @Test
        @DisplayName("Should return *** for short card number")
        void shouldReturnStars_forShortCard() {
            assertThat(PiiMasker.maskCardNumber("12")).isEqualTo("***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty card number")
        void shouldReturnStars_forNullAndEmpty(String card) {
            assertThat(PiiMasker.maskCardNumber(card)).isEqualTo("***");
        }
    }

    // ---- Address masking ----

    @Nested
    @DisplayName("maskAddress")
    class MaskAddress {

        @Test
        @DisplayName("Should mask address showing first char of each word")
        void shouldMaskAddress() {
            String result = PiiMasker.maskAddress("123 Main Street");
            assertThat(result).isEqualTo("1*** M*** S***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty address")
        void shouldReturnStars_forNullAndEmpty(String address) {
            assertThat(PiiMasker.maskAddress(address)).isEqualTo("***");
        }
    }

    // ---- IP masking ----

    @Nested
    @DisplayName("maskIpAddress")
    class MaskIpAddress {

        @Test
        @DisplayName("Should mask IPv4 showing only first two octets")
        void shouldMaskIpv4() {
            String result = PiiMasker.maskIpAddress("192.168.1.100");
            assertThat(result).isEqualTo("192.168.***");
        }

        @Test
        @DisplayName("Should mask IPv6 showing only first segment")
        void shouldMaskIpv6() {
            String result = PiiMasker.maskIpAddress("2001:db8:85a3:0:0:8a2e:370:7334");
            assertThat(result).isEqualTo("2001:***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty IP")
        void shouldReturnStars_forNullAndEmpty(String ip) {
            assertThat(PiiMasker.maskIpAddress(ip)).isEqualTo("***");
        }

        @Test
        @DisplayName("Should return *** for unrecognized IP format")
        void shouldReturnStars_forUnrecognizedFormat() {
            assertThat(PiiMasker.maskIpAddress("localhost")).isEqualTo("***");
        }
    }

    // ---- ID masking ----

    @Nested
    @DisplayName("maskId")
    class MaskId {

        @Test
        @DisplayName("Should mask long IDs showing first 4 and last 4 characters")
        void shouldMaskLongId() {
            String result = PiiMasker.maskId("507f1f77bcf86cd799439011");
            assertThat(result).isEqualTo("507f***9011");
        }

        @Test
        @DisplayName("Should mask short IDs showing first 2 characters")
        void shouldMaskShortId() {
            String result = PiiMasker.maskId("ABC12345");
            assertThat(result).isEqualTo("AB***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return *** for null and empty ID")
        void shouldReturnStars_forNullAndEmpty(String id) {
            assertThat(PiiMasker.maskId(id)).isEqualTo("***");
        }
    }

    // ---- Generic mask methods ----

    @Nested
    @DisplayName("Generic mask utilities")
    class GenericMask {

        @Test
        @DisplayName("mask(value, showFirst) should show first N chars and mask rest")
        void shouldMaskWithShowFirst() {
            assertThat(PiiMasker.mask("HelloWorld", 3)).isEqualTo("Hel***");
        }

        @Test
        @DisplayName("mask(value, showFirst) should return *** when value is shorter than showFirst")
        void shouldReturnStars_whenShorterThanShowFirst() {
            assertThat(PiiMasker.mask("Hi", 5)).isEqualTo("***");
        }

        @Test
        @DisplayName("mask(value, showFirst, showLast) should show first and last N chars")
        void shouldMaskWithShowFirstAndLast() {
            assertThat(PiiMasker.mask("HelloWorld", 2, 3)).isEqualTo("He***rld");
        }

        @Test
        @DisplayName("mask(value, showFirst, showLast) should return *** when too short")
        void shouldReturnStars_whenTooShortForFirstAndLast() {
            assertThat(PiiMasker.mask("Hi", 2, 2)).isEqualTo("***");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Generic mask should return *** for null and empty")
        void shouldReturnStars_forNullAndEmpty(String value) {
            assertThat(PiiMasker.mask(value, 3)).isEqualTo("***");
            assertThat(PiiMasker.mask(value, 2, 2)).isEqualTo("***");
        }
    }
}
