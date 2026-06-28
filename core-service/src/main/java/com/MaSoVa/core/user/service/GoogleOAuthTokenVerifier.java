package com.MaSoVa.core.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Local cryptographic verification of Google ID tokens (Tasks 15–17).
 * Replaces the online tokeninfo HTTP round-trip.
 */
@Service
public class GoogleOAuthTokenVerifier {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleOAuthTokenVerifier(@Value("${google.oauth.client-id:}") String clientId) {
        this.clientId = clientId;
        if (clientId == null || clientId.isBlank()) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                            new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
        }
    }

    public Map<String, Object> verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException(
                    "Google OAuth client ID is not configured. Set GOOGLE_OAUTH_CLIENT_ID.");
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new RuntimeException("Google token verification failed");
            }
            return toClaimsMap(token.getPayload());
        } catch (GeneralSecurityException | IOException e) {
            throw new RuntimeException("Google token verification failed: " + e.getMessage());
        }
    }

    static Map<String, Object> toClaimsMap(GoogleIdToken.Payload payload) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", payload.getSubject());
        claims.put("email", payload.getEmail());
        claims.put("email_verified", payload.getEmailVerified());
        claims.put("name", payload.get("name"));
        Object audience = payload.getAudience();
        if (audience instanceof String aud) {
            claims.put("aud", aud);
        } else if (audience instanceof java.util.List<?> audList && !audList.isEmpty()) {
            claims.put("aud", audList.get(0));
        }
        return claims;
    }

    static void validateEmailVerified(Map<String, Object> claims) {
        Object verified = claims.get("email_verified");
        if (verified instanceof Boolean && !((Boolean) verified)) {
            throw new RuntimeException("Google account email is not verified");
        }
        if (verified instanceof String && "false".equalsIgnoreCase((String) verified)) {
            throw new RuntimeException("Google account email is not verified");
        }
    }
}