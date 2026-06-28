package com.MaSoVa.core.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;


import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("GoogleOAuthTokenVerifier (Tasks 15–17)")
class GoogleOAuthTokenVerifierTest {

    @Test
    @DisplayName("verify throws IllegalStateException when client ID is blank")
    void verifyThrowsWhenClientIdMissing() {
        GoogleOAuthTokenVerifier verifier = new GoogleOAuthTokenVerifier("");

        assertThatThrownBy(() -> verifier.verify("any-token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GOOGLE_OAUTH_CLIENT_ID");
    }

    @Test
    @DisplayName("validateEmailVerified rejects unverified email")
    void rejectsUnverifiedEmail() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email_verified", false);

        assertThatThrownBy(() -> GoogleOAuthTokenVerifier.validateEmailVerified(claims))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not verified");
    }

    @Test
    @DisplayName("toClaimsMap preserves expected claim keys")
    void toClaimsMapPreservesShape() {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setSubject("google-sub-1");
        payload.setEmail("user@gmail.com");
        payload.setEmailVerified(true);
        payload.set("name", "Test User");
        payload.setAudience("client-id.apps.googleusercontent.com");

        Map<String, Object> claims = GoogleOAuthTokenVerifier.toClaimsMap(payload);

        assertThat(claims)
                .containsEntry("sub", "google-sub-1")
                .containsEntry("email", "user@gmail.com")
                .containsEntry("email_verified", true)
                .containsEntry("name", "Test User")
                .containsEntry("aud", "client-id.apps.googleusercontent.com");
    }
}