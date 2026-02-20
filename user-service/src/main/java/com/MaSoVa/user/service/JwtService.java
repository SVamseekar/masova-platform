package com.MaSoVa.user.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * JWT secret key - MUST be configured via environment variable or application properties.
     * No default value for security reasons (SEC-001).
     *
     * Configure via:
     * - Environment variable: JWT_SECRET
     * - Application property: jwt.secret
     *
     * Requirements:
     * - Minimum 64 characters (512 bits) for HS512 algorithm
     * - Should be cryptographically random
     * - Never commit to version control
     */
    @Value("${jwt.secret:}")
    private String secretKey;

    @Value("${jwt.access-token-expiration:3600000}") // 1 hour
    private Long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800000}") // 7 days
    private Long refreshTokenExpiration;

    @Value("${jwt.kiosk-access-token-expiration:2592000000}") // 30 days
    private Long kioskAccessTokenExpiration;

    @Value("${jwt.kiosk-refresh-token-expiration:7776000000}") // 90 days
    private Long kioskRefreshTokenExpiration;

    /**
     * Validates JWT secret key on application startup.
     * Fails fast if secret is not properly configured.
     */
    @PostConstruct
    public void validateSecretKey() {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            String errorMsg = "CRITICAL SECURITY ERROR: JWT secret key is not configured! " +
                    "Set the JWT_SECRET environment variable or jwt.secret property. " +
                    "Key must be at least 64 characters for HS512 algorithm.";
            logger.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        if (secretKey.length() < 64) {
            String errorMsg = "CRITICAL SECURITY ERROR: JWT secret key is too short (" +
                    secretKey.length() + " chars). " +
                    "Must be at least 64 characters (512 bits) for HS512 algorithm security.";
            logger.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        // Check for common insecure patterns
        String lowerKey = secretKey.toLowerCase();
        if (lowerKey.contains("secret") || lowerKey.contains("password") ||
                lowerKey.contains("masova") || lowerKey.contains("default") ||
                lowerKey.contains("test") || lowerKey.contains("example")) {
            logger.warn("SECURITY WARNING: JWT secret key appears to contain common/predictable patterns. " +
                    "Consider using a cryptographically random key in production.");
        }

        logger.info("JWT secret key validated successfully (length: {} chars)", secretKey.length());
    }
    
    public String generateAccessToken(String userId, String userType, String storeId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userType", userType);
        if (storeId != null) {
            claims.put("storeId", storeId);
        }

        // Add roles claim based on userType
        // Note: Do NOT add "ROLE_" prefix here - JwtAuthenticationFilter will add it
        List<String> roles = new ArrayList<>();
        roles.add(userType);
        claims.put("roles", roles);

        return createToken(claims, userId, accessTokenExpiration);
    }
    
    public String generateRefreshToken(String userId) {
        return createToken(new HashMap<>(), userId, refreshTokenExpiration);
    }

    /**
     * Generate long-lived access token for kiosk accounts
     *
     * Kiosk tokens have:
     * - 30-day expiration (vs. 1 hour for regular users)
     * - Special claim "isKiosk: true" for identification
     * - Terminal ID for tracking which POS terminal
     *
     * @param userId User ID of the kiosk account
     * @param storeId Store ID where kiosk is deployed
     * @param terminalId Terminal identifier (e.g., "POS-01")
     * @return Long-lived JWT access token
     */
    public String generateKioskAccessToken(String userId, String storeId, String terminalId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userType", "KIOSK");
        claims.put("storeId", storeId);
        claims.put("terminalId", terminalId);
        claims.put("isKiosk", true);  // Special flag for kiosk tokens

        // Add roles claim
        // Note: Do NOT add "ROLE_" prefix here - JwtAuthenticationFilter will add it
        List<String> roles = new ArrayList<>();
        roles.add("KIOSK");
        claims.put("roles", roles);

        logger.info("Generating kiosk access token for user {} at store {} (terminal: {})",
                    userId, storeId, terminalId);

        return createToken(claims, userId, kioskAccessTokenExpiration);
    }

    /**
     * Generate long-lived refresh token for kiosk accounts (90 days)
     */
    public String generateKioskRefreshToken(String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("isKiosk", true);

        logger.info("Generating kiosk refresh token for user {}", userId);

        return createToken(claims, userId, kioskRefreshTokenExpiration);
    }

    /**
     * Check if a token is a kiosk token
     */
    public boolean isKioskToken(String token) {
        try {
            Boolean isKiosk = extractClaim(token, claims -> claims.get("isKiosk", Boolean.class));
            return isKiosk != null && isKiosk;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extract terminal ID from token
     */
    public String extractTerminalId(String token) {
        return extractClaim(token, claims -> claims.get("terminalId", String.class));
    }
    
    /**
     * Blacklist a token in Redis until it would naturally expire.
     * Called on logout so the token cannot be reused even if stolen.
     */
    public void invalidateToken(String token) {
        try {
            Date expiration = extractExpiration(token);
            long remainingMs = expiration.getTime() - System.currentTimeMillis();
            if (remainingMs > 0) {
                redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + token, "1", remainingMs, TimeUnit.MILLISECONDS
                );
                logger.debug("Token blacklisted for {}ms", remainingMs);
            }
        } catch (Exception e) {
            logger.warn("Failed to blacklist token: {}", e.getMessage());
        }
    }

    /**
     * Check if a token has been blacklisted (i.e. the user logged out).
     */
    public boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
        } catch (Exception e) {
            logger.warn("Redis blacklist check failed, allowing token: {}", e.getMessage());
            return false; // fail-open: don't lock users out if Redis is down
        }
    }

    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignKey())
                .compact();
    }
    
    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public String extractUserType(String token) {
        return extractClaim(token, claims -> claims.get("userType", String.class));
    }
    
    public String extractStoreId(String token) {
        return extractClaim(token, claims -> claims.get("storeId", String.class));
    }
    
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public boolean validateToken(String token, String userId) {
        final String extractedUserId = extractUserId(token);
        return extractedUserId.equals(userId) && !isTokenExpired(token);
    }
    
    private SecretKey getSignKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}