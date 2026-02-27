package com.MaSoVa.shared.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InputValidator")
class InputValidatorTest {

    private InputValidator validator;

    @BeforeEach
    void setUp() {
        validator = new InputValidator();
    }

    // ---- Email validation ----

    @Nested
    @DisplayName("Email validation")
    class EmailValidation {

        @Test
        @DisplayName("Should accept a standard email address")
        void shouldAcceptValidEmail() {
            assertThat(validator.isValidEmail("john.doe@example.com")).isTrue();
        }

        @Test
        @DisplayName("Should accept email with plus addressing")
        void shouldAcceptPlusAddressing() {
            assertThat(validator.isValidEmail("user+tag@example.com")).isTrue();
        }

        @Test
        @DisplayName("Should accept email with subdomain")
        void shouldAcceptSubdomain() {
            assertThat(validator.isValidEmail("user@mail.example.co.uk")).isTrue();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty emails")
        void shouldRejectNullAndEmpty(String email) {
            assertThat(validator.isValidEmail(email)).isFalse();
        }

        @Test
        @DisplayName("Should reject email without @ symbol")
        void shouldRejectWithoutAt() {
            assertThat(validator.isValidEmail("notanemail")).isFalse();
        }

        @Test
        @DisplayName("Should reject email without domain extension")
        void shouldRejectWithoutDomainExtension() {
            assertThat(validator.isValidEmail("user@")).isFalse();
        }

        @Test
        @DisplayName("Should reject email with spaces")
        void shouldRejectWithSpaces() {
            assertThat(validator.isValidEmail("user @example.com")).isFalse();
        }
    }

    // ---- Phone validation ----

    @Nested
    @DisplayName("Phone validation")
    class PhoneValidation {

        @Test
        @DisplayName("Should accept a standard phone number")
        void shouldAcceptStandardPhone() {
            assertThat(validator.isValidPhone("1234567890")).isTrue();
        }

        @Test
        @DisplayName("Should accept phone with country code prefix")
        void shouldAcceptWithCountryCode() {
            assertThat(validator.isValidPhone("+31612345678")).isTrue();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty phone numbers")
        void shouldRejectNullAndEmpty(String phone) {
            assertThat(validator.isValidPhone(phone)).isFalse();
        }

        @Test
        @DisplayName("Should reject phone with letters")
        void shouldRejectWithLetters() {
            assertThat(validator.isValidPhone("123-ABC-4567")).isFalse();
        }
    }

    // ---- Username validation ----

    @Nested
    @DisplayName("Username validation")
    class UsernameValidation {

        @Test
        @DisplayName("Should accept alphanumeric username between 3-20 chars")
        void shouldAcceptValidUsername() {
            assertThat(validator.isValidUsername("john_doe123")).isTrue();
        }

        @Test
        @DisplayName("Should accept username with hyphens")
        void shouldAcceptWithHyphens() {
            assertThat(validator.isValidUsername("john-doe")).isTrue();
        }

        @Test
        @DisplayName("Should reject username shorter than 3 characters")
        void shouldRejectTooShort() {
            assertThat(validator.isValidUsername("ab")).isFalse();
        }

        @Test
        @DisplayName("Should reject username longer than 20 characters")
        void shouldRejectTooLong() {
            assertThat(validator.isValidUsername("a".repeat(21))).isFalse();
        }

        @Test
        @DisplayName("Should reject username with special characters")
        void shouldRejectSpecialChars() {
            assertThat(validator.isValidUsername("john@doe")).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty usernames")
        void shouldRejectNullAndEmpty(String username) {
            assertThat(validator.isValidUsername(username)).isFalse();
        }
    }

    // ---- XSS detection ----

    @Nested
    @DisplayName("XSS detection")
    class XssDetection {

        @Test
        @DisplayName("Should detect script tags")
        void shouldDetectScriptTags() {
            assertThat(validator.containsXSS("<script>alert('XSS')</script>")).isTrue();
        }

        @Test
        @DisplayName("Should detect javascript: protocol in attributes")
        void shouldDetectJavascriptProtocol() {
            assertThat(validator.containsXSS("<a href=\"javascript:alert(1)\">click</a>")).isTrue();
        }

        @Test
        @DisplayName("Should detect onerror event handler")
        void shouldDetectOnerror() {
            assertThat(validator.containsXSS("<img onerror=alert(1) src=x>")).isTrue();
        }

        @Test
        @DisplayName("Should return false for safe input")
        void shouldReturnFalse_forSafeInput() {
            assertThat(validator.containsXSS("Hello World")).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return false for null and empty input")
        void shouldReturnFalse_forNullAndEmpty(String input) {
            assertThat(validator.containsXSS(input)).isFalse();
        }
    }

    // ---- SQL injection detection ----

    @Nested
    @DisplayName("SQL injection detection")
    class SqlInjectionDetection {

        @Test
        @DisplayName("Should detect classic OR-based injection")
        void shouldDetectOrInjection() {
            assertThat(validator.containsSQLInjection("1 OR 1=1")).isTrue();
        }

        @Test
        @DisplayName("Should detect UNION SELECT injection")
        void shouldDetectUnionSelect() {
            assertThat(validator.containsSQLInjection("UNION SELECT * FROM users")).isTrue();
        }

        @Test
        @DisplayName("Should detect DROP TABLE injection")
        void shouldDetectDropTable() {
            assertThat(validator.containsSQLInjection("'; DROP TABLE orders; --")).isTrue();
        }

        @Test
        @DisplayName("Should return false for normal text")
        void shouldReturnFalse_forNormalText() {
            // Note: this validator is aggressive - words like "and" trigger it
            assertThat(validator.containsSQLInjection("Hello World 123")).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should return false for null and empty input")
        void shouldReturnFalse_forNullAndEmpty(String input) {
            assertThat(validator.containsSQLInjection(input)).isFalse();
        }
    }

    // ---- XSS sanitization ----

    @Nested
    @DisplayName("XSS sanitization")
    class XssSanitization {

        @Test
        @DisplayName("Should escape angle brackets")
        void shouldEscapeAngleBrackets() {
            String result = validator.sanitizeXSS("<script>alert('xss')</script>");
            assertThat(result).doesNotContain("<").doesNotContain(">");
            assertThat(result).contains("&lt;").contains("&gt;");
        }

        @Test
        @DisplayName("Should escape quotes")
        void shouldEscapeQuotes() {
            String result = validator.sanitizeXSS("He said \"hello\"");
            assertThat(result).contains("&quot;");
        }

        @Test
        @DisplayName("Should escape single quotes")
        void shouldEscapeSingleQuotes() {
            String result = validator.sanitizeXSS("It's a test");
            assertThat(result).contains("&#x27;");
        }

        @Test
        @DisplayName("Should return null for null input")
        void shouldReturnNull_forNullInput() {
            assertThat(validator.sanitizeXSS(null)).isNull();
        }

        @Test
        @DisplayName("Should leave safe text unchanged (except slashes/parens)")
        void shouldLeaveSafeText_mostlyUnchanged() {
            String result = validator.sanitizeXSS("Hello World 123");
            assertThat(result).isEqualTo("Hello World 123");
        }
    }

    // ---- Length validation ----

    @Nested
    @DisplayName("String length validation")
    class LengthValidation {

        @Test
        @DisplayName("Should accept string within min and max bounds")
        void shouldAcceptWithinBounds() {
            assertThat(validator.isValidLength("hello", 1, 10)).isTrue();
        }

        @Test
        @DisplayName("Should accept string at exact min length")
        void shouldAcceptAtMinLength() {
            assertThat(validator.isValidLength("abc", 3, 10)).isTrue();
        }

        @Test
        @DisplayName("Should accept string at exact max length")
        void shouldAcceptAtMaxLength() {
            assertThat(validator.isValidLength("abcde", 1, 5)).isTrue();
        }

        @Test
        @DisplayName("Should reject null input")
        void shouldRejectNull() {
            assertThat(validator.isValidLength(null, 1, 10)).isFalse();
        }

        @Test
        @DisplayName("Should reject string below min length")
        void shouldRejectBelowMin() {
            assertThat(validator.isValidLength("ab", 3, 10)).isFalse();
        }

        @Test
        @DisplayName("Should reject string above max length")
        void shouldRejectAboveMax() {
            assertThat(validator.isValidLength("abcdefghijk", 1, 10)).isFalse();
        }
    }

    // ---- Password strength ----

    @Nested
    @DisplayName("Password strength checking")
    class PasswordStrength {

        @Test
        @DisplayName("Should return WEAK for null password")
        void shouldReturnWeak_forNull() {
            assertThat(validator.checkPasswordStrength(null))
                    .isEqualTo(InputValidator.PasswordStrength.WEAK);
        }

        @Test
        @DisplayName("Should return WEAK for empty password")
        void shouldReturnWeak_forEmpty() {
            assertThat(validator.checkPasswordStrength(""))
                    .isEqualTo(InputValidator.PasswordStrength.WEAK);
        }

        @Test
        @DisplayName("Should return WEAK for short simple password")
        void shouldReturnWeak_forShortSimple() {
            assertThat(validator.checkPasswordStrength("abc"))
                    .isEqualTo(InputValidator.PasswordStrength.WEAK);
        }

        @Test
        @DisplayName("Should return STRONG for complex password")
        void shouldReturnStrong_forComplexPassword() {
            assertThat(validator.checkPasswordStrength("MyP@ssw0rd!123"))
                    .isEqualTo(InputValidator.PasswordStrength.STRONG);
        }

        @Test
        @DisplayName("Should return MEDIUM for moderate password")
        void shouldReturnMedium_forModeratePassword() {
            assertThat(validator.checkPasswordStrength("Abcdef12"))
                    .isEqualTo(InputValidator.PasswordStrength.MEDIUM);
        }
    }

    // ---- Numeric validation ----

    @Nested
    @DisplayName("Numeric validation")
    class NumericValidation {

        @Test
        @DisplayName("Should accept valid integer string")
        void shouldAcceptValidInteger() {
            assertThat(validator.isValidInteger("42")).isTrue();
        }

        @Test
        @DisplayName("Should accept negative integer")
        void shouldAcceptNegativeInteger() {
            assertThat(validator.isValidInteger("-5")).isTrue();
        }

        @Test
        @DisplayName("Should reject decimal for integer validation")
        void shouldRejectDecimalForInteger() {
            assertThat(validator.isValidInteger("3.14")).isFalse();
        }

        @Test
        @DisplayName("Should accept valid decimal number")
        void shouldAcceptDecimalNumber() {
            assertThat(validator.isValidNumber("3.14")).isTrue();
        }

        @Test
        @DisplayName("Should accept positive number")
        void shouldAcceptPositiveNumber() {
            assertThat(validator.isPositiveNumber("5.5")).isTrue();
        }

        @Test
        @DisplayName("Should reject zero for positive number check")
        void shouldRejectZero_forPositive() {
            assertThat(validator.isPositiveNumber("0")).isFalse();
        }

        @Test
        @DisplayName("Should reject negative for positive number check")
        void shouldRejectNegative_forPositive() {
            assertThat(validator.isPositiveNumber("-3")).isFalse();
        }

        @Test
        @DisplayName("Should reject non-numeric strings")
        void shouldRejectNonNumeric() {
            assertThat(validator.isValidNumber("abc")).isFalse();
            assertThat(validator.isValidInteger("xyz")).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty for all numeric checks")
        void shouldRejectNullAndEmpty(String input) {
            assertThat(validator.isValidNumber(input)).isFalse();
            assertThat(validator.isValidInteger(input)).isFalse();
            assertThat(validator.isPositiveNumber(input)).isFalse();
        }
    }

    // ---- URL validation ----

    @Nested
    @DisplayName("URL validation")
    class UrlValidation {

        @Test
        @DisplayName("Should accept valid HTTP URL")
        void shouldAcceptValidHttpUrl() {
            assertThat(validator.isValidUrl("http://example.com")).isTrue();
        }

        @Test
        @DisplayName("Should accept valid HTTPS URL")
        void shouldAcceptValidHttpsUrl() {
            assertThat(validator.isValidUrl("https://example.com/path?q=1")).isTrue();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty URLs")
        void shouldRejectNullAndEmpty(String url) {
            assertThat(validator.isValidUrl(url)).isFalse();
        }

        @Test
        @DisplayName("Should reject non-URL string")
        void shouldRejectNonUrl() {
            assertThat(validator.isValidUrl("not a url")).isFalse();
        }
    }

    // ---- Alphanumeric validation ----

    @Nested
    @DisplayName("Alphanumeric validation")
    class AlphanumericValidation {

        @Test
        @DisplayName("Should accept alphanumeric with spaces")
        void shouldAcceptAlphanumericWithSpaces() {
            assertThat(validator.isAlphanumeric("Hello World 123")).isTrue();
        }

        @Test
        @DisplayName("Should reject input with special characters")
        void shouldRejectSpecialChars() {
            assertThat(validator.isAlphanumeric("hello@world")).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("Should reject null and empty")
        void shouldRejectNullAndEmpty(String input) {
            assertThat(validator.isAlphanumeric(input)).isFalse();
        }
    }
}
