package com.MaSoVa.core.user.controller;

import com.MaSoVa.core.user.dto.*;
import com.MaSoVa.core.user.service.UserService;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Canonical auth endpoints — POST /api/auth/*.
 * All 7 auth operations live here; UserController handles user management only.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login, register, logout, token refresh, Google sign-in")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private com.MaSoVa.core.user.service.JwtService jwtService;

    // Rate limiting: IP -> failed PIN attempt count (expires after 15 min)
    private final LoadingCache<String, Integer> pinAttempts = CacheBuilder.newBuilder()
            .expireAfterWrite(15, java.util.concurrent.TimeUnit.MINUTES)
            .build(new CacheLoader<String, Integer>() {
                @Override
                public Integer load(String key) {
                    return 0;
                }
            });

    @PostMapping("/login")
    @Operation(summary = "Login with email + password")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.authenticate(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new customer account")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate token")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("X-User-Id") String userId,
            HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization header with Bearer token required"));
        }
        userService.logout(userId, accessToken);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> request) {
        String newAccessToken = userService.refreshAccessToken(request.get("refreshToken"));
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    @PostMapping("/google")
    @Operation(summary = "Google sign-in — login or register (backend detects)")
    public ResponseEntity<?> googleSignIn(@Valid @RequestBody GoogleLoginRequest request) {
        // Try login first; if user not found (NoSuchElementException), register
        try {
            return ResponseEntity.ok(userService.loginWithGoogle(request.getIdToken()));
        } catch (java.util.NoSuchElementException e) {
            log.info("Google user not found, registering: {}", e.getMessage());
            return ResponseEntity.ok(userService.registerWithGoogle(request.getIdToken()));
        } catch (Exception e) {
            log.error("Google sign-in failed: {}", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Google sign-in failed"));
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> request) {
        userService.changePassword(userId, request.get("currentPassword"), request.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/validate-pin")
    @Operation(summary = "Validate employee PIN")
    public ResponseEntity<?> validatePin(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String pin = request.get("pin");
        String clientIp = getClientIp(httpRequest);

        if (pin == null || pin.length() != 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid PIN format. PIN must be 5 digits."));
        }

        try {
            Integer attempts = pinAttempts.getUnchecked(clientIp);
            if (attempts >= 5) {
                log.warn("PIN validation blocked for IP {} — too many attempts ({})", clientIp, attempts);
                return ResponseEntity.status(429).body(Map.of(
                        "error", "Too many failed attempts. Please try again in 15 minutes.",
                        "lockoutMinutes", 15));
            }

            com.MaSoVa.shared.entity.User user = userService.findUserByPIN(pin);

            if (user == null || !user.isEmployee()) {
                pinAttempts.put(clientIp, attempts + 1);
                log.warn("Invalid PIN attempt from IP {}: {} total attempts", clientIp, attempts + 1);
                return ResponseEntity.status(401).body(Map.of(
                        "error", "Invalid PIN",
                        "attemptsRemaining", Math.max(0, 5 - (attempts + 1))));
            }

            if (!user.isActive()) {
                pinAttempts.put(clientIp, attempts + 1);
                log.warn("PIN validation failed for inactive account from IP {}", clientIp);
                return ResponseEntity.status(401).body(Map.of("error", "Employee account is inactive"));
            }

            pinAttempts.invalidate(clientIp);
            log.info("PIN validated successfully for user {} from IP {}", user.getId(), clientIp);

            return ResponseEntity.ok(Map.of(
                    "userId", user.getId(),
                    "name", user.getPersonalInfo().getName(),
                    "type", user.getType().toString(),
                    "role", user.getEmployeeDetails().getRole() != null ? user.getEmployeeDetails().getRole() : "Staff",
                    "storeId", user.getEmployeeDetails().getStoreId() != null ? user.getEmployeeDetails().getStoreId() : ""));

        } catch (Exception e) {
            log.error("Error validating PIN from IP {}: {}", clientIp, e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Invalid PIN"));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
