package com.MaSoVa.shared.security.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    /** Known leaked default — denylisted for one release to catch stale environments. */
    static final String DENYLISTED_LEAKED_SECRET =
            "MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-256-bits-for-production-security";

    private static final int MIN_SECRET_LENGTH = 64;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration:3600000}")
    private long accessTokenExpiration;

    private SecretKey key;

    @PostConstruct
    public void init() {
        validateJwtSecret(jwtSecret);
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Fail-fast validation for JWT secret configuration (security remediation Task 8).
     */
    static void validateJwtSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is not configured. Set JWT_SECRET or jwt.secret (min 64 chars).");
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "JWT secret is too short (" + secret.length() + " chars). Minimum is "
                            + MIN_SECRET_LENGTH + " for HS512.");
        }
        if (DENYLISTED_LEAKED_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "JWT secret matches a known leaked default. Generate a new secret and set JWT_SECRET.");
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.getSubject();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.get("email", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.get("roles", List.class);
    }

    public String getStoreIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.get("storeId", String.class);
    }

    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            return claims.getExpiration().before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }
}
