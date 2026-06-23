package com.MaSoVa.shared.security.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtTokenProvider secret validation (Task 8)")
class JwtTokenProviderTest {

    private static final String VALID_SECRET =
            "a-valid-jwt-secret-key-with-at-least-sixty-four-characters-for-hs512-algo";

    @Test
    @DisplayName("accepts a sufficiently long non-denylisted secret")
    void acceptsValidSecret() {
        assertThatCode(() -> JwtTokenProvider.validateJwtSecret(VALID_SECRET))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("rejects null/empty secret")
    void rejectsMissingSecret() {
        assertThatThrownBy(() -> JwtTokenProvider.validateJwtSecret(""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    @DisplayName("rejects secret shorter than 64 characters")
    void rejectsShortSecret() {
        assertThatThrownBy(() -> JwtTokenProvider.validateJwtSecret("too-short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("too short");
    }

    @Test
    @DisplayName("rejects the known leaked default secret")
    void rejectsDenylistedSecret() {
        assertThatThrownBy(() -> JwtTokenProvider.validateJwtSecret(JwtTokenProvider.DENYLISTED_LEAKED_SECRET))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("known leaked");
    }
}