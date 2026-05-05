package com.MaSoVa.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

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

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

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

        logger.info("API Gateway JWT secret key validated successfully (length: {} chars)", secretKey.length());
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Check if Authorization header is present
            if (!request.getHeaders().containsKey("Authorization")) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            try {
                // Validate and parse JWT token
                Claims claims = validateToken(token);

                // Extract user information
                String userId = claims.getSubject();
                String userType = claims.get("userType", String.class);
                String storeId = claims.get("storeId", String.class);

                // Validate storeId requirement for non-customer roles
                // Staff, managers, drivers, and kiosks MUST have a storeId in their token
                boolean isStaffRole = userType != null &&
                    (userType.equals("MANAGER") || userType.equals("ASSISTANT_MANAGER") ||
                     userType.equals("STAFF") || userType.equals("DRIVER") || userType.equals("KIOSK"));

                if (isStaffRole && (storeId == null || storeId.trim().isEmpty())) {
                    logger.warn("Staff user {} attempted access without storeId", userId);
                    return onError(exchange, "Store context required for staff users", HttpStatus.FORBIDDEN);
                }

                // Add user info to request headers for downstream services
                // Keep the original Authorization header for downstream authentication
                ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate()
                        .header("Authorization", authHeader) // Forward the original Authorization header
                        .header("X-User-Id", userId)
                        .header("X-User-Type", userType != null ? userType : "");

                // Set store context headers that match what StoreContextUtil expects
                // Use X-User-Store-Id for the user's assigned store from JWT token
                if (storeId != null && !storeId.trim().isEmpty()) {
                    requestBuilder.header("X-User-Store-Id", storeId);
                }

                // Also forward X-Selected-Store-Id if present in the original request
                // This allows managers/customers to select a different store to view
                String selectedStoreId = request.getHeaders().getFirst("X-Selected-Store-Id");
                if (selectedStoreId != null && !selectedStoreId.trim().isEmpty()) {
                    requestBuilder.header("X-Selected-Store-Id", selectedStoreId);
                }

                ServerHttpRequest modifiedRequest = requestBuilder.build();

                logger.info("JWT validated for user: {} ({}) store: {}", userId, userType,
                    storeId != null ? storeId : "N/A");

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (Exception e) {
                logger.error("JWT validation failed: {}", e.getMessage());
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes());

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // Check expiration
        if (claims.getExpiration().before(new Date())) {
            throw new RuntimeException("Token has expired");
        }

        return claims;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        logger.warn("Authentication error: {} - Status: {}", message, status);
        return response.setComplete();
    }

    public static class Config {
        // Configuration properties can be added here if needed
    }
}
