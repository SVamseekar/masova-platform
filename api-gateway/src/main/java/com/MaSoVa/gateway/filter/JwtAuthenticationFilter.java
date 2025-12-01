package com.MaSoVa.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

    @Value("${jwt.secret:MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement}")
    private String secretKey;

    public JwtAuthenticationFilter() {
        super(Config.class);
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

                // Add user info to request headers for downstream services
                // Keep the original Authorization header for downstream authentication
                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("Authorization", authHeader) // Forward the original Authorization header
                        .header("X-User-Id", userId)
                        .header("X-User-Type", userType)
                        .header("X-Store-Id", storeId != null ? storeId : "")
                        .build();

                logger.info("JWT validated for user: {} ({})", userId, userType);

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
