package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.core.user.dto.*;
import com.MaSoVa.core.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * User management — 11 canonical endpoints at /api/users.
 * Auth operations (login, register, logout, refresh, google, change-password, validate-pin)
 * have moved to AuthController at /api/auth.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User CRUD, status, kiosk, and PIN management")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private com.MaSoVa.core.user.service.JwtService jwtService;

    @Autowired
    private com.MaSoVa.core.user.service.WorkingSessionService workingSessionService;

    // ── LIST ────────────────────────────────────────────────────────────────────

    /**
     * GET /api/users?type=DRIVER&storeId=&available=true&search=
     * Replaces: /api/users, /api/users/type/{type}, /api/users/store,
     *           /api/users/managers, /api/users/drivers/store,
     *           /api/users/drivers/available, /api/users/search
     */
    @GetMapping
    @Operation(summary = "List users (query: type, storeId, available, search)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) UserType type,
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {

        String resolvedStore = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);

        if (search != null) {
            return ResponseEntity.ok(userService.searchUsers(null, null, null, type, resolvedStore));
        }
        if (type == UserType.DRIVER && Boolean.TRUE.equals(available) && resolvedStore != null) {
            return ResponseEntity.ok(userService.getAvailableDrivers(resolvedStore));
        }
        if (type == UserType.DRIVER && resolvedStore != null) {
            return ResponseEntity.ok(userService.getDriversByStore(resolvedStore));
        }
        if (type != null && resolvedStore != null) {
            return ResponseEntity.ok(userService.getUsersByTypeAndStore(type, resolvedStore));
        }
        if (type != null) {
            return ResponseEntity.ok(userService.getUsersByType(type));
        }
        if (resolvedStore != null) {
            return ResponseEntity.ok(userService.getStoreEmployees(resolvedStore));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // ── SINGLE USER ─────────────────────────────────────────────────────────────

    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUserResponseById(userId));
    }

    @PatchMapping("/{userId}")
    @Operation(summary = "Update user (any field including status)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("#userId == authentication.name or hasRole('MANAGER')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    // ── STATUS TRANSITIONS ───────────────────────────────────────────────────────

    @PostMapping("/{userId}/activate")
    @Operation(summary = "Activate user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable String userId) {
        userService.activateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PostMapping("/{userId}/deactivate")
    @Operation(summary = "Deactivate user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    // ── PIN MANAGEMENT ───────────────────────────────────────────────────────────

    /**
     * POST /api/users/{userId}/generate-pin
     * body: { bulk: true } — generates PINs for all employees (manager action)
     */
    @PostMapping("/{userId}/generate-pin")
    @Operation(summary = "Generate PIN for employee (body: bulk=true for all employees)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<?> generatePin(
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body != null && Boolean.TRUE.equals(body.get("bulk"))) {
            Map<String, String> results = userService.generatePINsForAllEmployees();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PIN generation completed",
                    "totalProcessed", results.size(),
                    "results", results));
        }
        String pin = userService.generateEmployeePIN(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "PIN generated successfully",
                "userId", userId,
                "pin", pin));
    }

    // ── KIOSK MANAGEMENT ─────────────────────────────────────────────────────────

    /**
     * POST /api/users/kiosk — create kiosk (was /api/users/kiosk/create)
     */
    @PostMapping("/kiosk")
    @Operation(summary = "Create kiosk account for POS terminal")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> createKiosk(
            @RequestHeader("X-User-Id") String managerId,
            @RequestBody Map<String, String> request) {
        String storeId = request.get("storeId");
        String terminalId = request.get("terminalId");
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Store ID is required"));
        }
        if (terminalId == null || terminalId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Terminal ID is required"));
        }
        User kiosk = userService.createKioskAccount(storeId, terminalId, managerId);
        LoginResponse tokens = userService.generateKioskTokens(kiosk.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Kiosk account created successfully",
                "kioskUserId", kiosk.getId(),
                "terminalId", terminalId,
                "storeId", storeId,
                "accessToken", tokens.getAccessToken(),
                "refreshToken", tokens.getRefreshToken(),
                "expiresIn", "30 days"));
    }

    /**
     * GET /api/users/kiosk?storeId= — list kiosks (was /api/users/kiosk/list)
     */
    @GetMapping("/kiosk")
    @Operation(summary = "List kiosk accounts (query: storeId)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> listKiosks(@RequestParam String storeId) {
        return ResponseEntity.ok(userService.getKioskAccountsByStore(storeId));
    }

    /**
     * POST /api/users/kiosk/{id}/regenerate — was /api/users/kiosk/{id}/regenerate-tokens
     */
    @PostMapping("/kiosk/{kioskUserId}/regenerate")
    @Operation(summary = "Regenerate tokens for kiosk account")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> regenerateKioskTokens(
            @PathVariable String kioskUserId,
            @RequestHeader("X-User-Id") String managerId) {
        LoginResponse tokens = userService.generateKioskTokens(kioskUserId);
        User kiosk = userService.getUserById(kioskUserId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Kiosk tokens regenerated successfully",
                "accessToken", tokens.getAccessToken(),
                "refreshToken", tokens.getRefreshToken(),
                "terminalId", kiosk.getEmployeeDetails().getTerminalId(),
                "expiresIn", "30 days"));
    }

    @PostMapping("/kiosk/{kioskUserId}/deactivate")
    @Operation(summary = "Deactivate kiosk account")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateKiosk(
            @PathVariable String kioskUserId,
            @RequestHeader("X-User-Id") String managerId) {
        userService.deactivateKioskAccount(kioskUserId, managerId);
        return ResponseEntity.ok(Map.of("success", "true", "message", "Kiosk account deactivated successfully"));
    }

    @PostMapping("/kiosk/auto-login")
    @Operation(summary = "Auto-login for kiosk terminals (public)")
    public ResponseEntity<Map<String, Object>> kioskAutoLogin(@RequestBody Map<String, String> request) {
        String kioskToken = request.get("kioskToken");
        if (kioskToken == null || kioskToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Kiosk token is required"));
        }
        try {
            if (!jwtService.isKioskToken(kioskToken)) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Invalid kiosk token"));
            }
            String userId = jwtService.extractUserId(kioskToken);
            User kiosk = userService.getUserById(userId);
            if (kiosk.getType() != UserType.KIOSK) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Invalid kiosk account"));
            }
            if (!kiosk.isActive()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Kiosk account is deactivated"));
            }
            Date expiration = jwtService.extractExpiration(kioskToken);
            long hoursUntilExpiry = (expiration.getTime() - System.currentTimeMillis()) / (1000 * 60 * 60);
            if (hoursUntilExpiry < 24) {
                LoginResponse tokens = userService.generateKioskTokens(userId);
                return ResponseEntity.ok(Map.of(
                        "success", true, "tokensRefreshed", true,
                        "accessToken", tokens.getAccessToken(),
                        "refreshToken", tokens.getRefreshToken(),
                        "user", tokens.getUser()));
            }
            return ResponseEntity.ok(Map.of("success", true, "tokensRefreshed", false,
                    "user", userService.mapToUserResponse(kiosk)));
        } catch (Exception e) {
            log.error("Kiosk auto-login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Auto-login failed: " + e.getMessage()));
        }
    }

    // ── DRIVER STATUS (internal, kept for backwards compat with driver app) ──────

    @GetMapping("/{userId}/status")
    @Operation(summary = "Get driver status")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getDriverStatus(@PathVariable String userId) {
        try {
            User user = userService.getUserByIdUncached(userId);
            if (user == null) return ResponseEntity.notFound().build();
            if (user.getType() != UserType.DRIVER) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "User is not a driver"));
            }
            String status = user.getEmployeeDetails() != null ? user.getEmployeeDetails().getStatus() : "OFF_DUTY";
            if (status == null || status.isEmpty()) status = "OFF_DUTY";
            boolean hasActiveSession = workingSessionService.isEmployeeCurrentlyWorking(userId);
            boolean isOnline = "AVAILABLE".equals(status) || hasActiveSession;
            return ResponseEntity.ok(Map.of(
                    "success", true, "userId", userId, "status", status,
                    "isOnline", isOnline, "hasActiveSession", hasActiveSession));
        } catch (Exception e) {
            log.error("Error fetching driver status: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "userId", userId, "status", "OFF_DUTY", "isOnline", false));
        }
    }

    @PutMapping("/{userId}/status")
    @Operation(summary = "Update driver status")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> updateDriverStatus(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Status is required"));
        }
        if (!List.of("AVAILABLE", "OFF_DUTY", "ON_DUTY", "BUSY").contains(status)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid status value"));
        }
        try {
            userService.updateDriverStatus(userId, status);
            return ResponseEntity.ok(Map.of("success", true, "userId", userId, "status", status,
                    "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Error updating driver status: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false,
                    "error", "Failed to update driver status: " + e.getMessage()));
        }
    }

    // ── PERMISSION CHECK (internal, kept for frontend) ───────────────────────────

    @GetMapping("/{userId}/can-take-orders")
    @Operation(summary = "Check if user can take orders")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> canTakeOrders(@PathVariable String userId) {
        try {
            boolean canTakeOrders = userService.canUserTakeOrders(userId);
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(Map.of(
                    "canTakeOrders", canTakeOrders,
                    "userType", user.getType().toString(),
                    "isEmployee", user.isEmployee(),
                    "isActive", user.isActive(),
                    "userId", userId,
                    "storeId", user.isEmployee() && user.getEmployeeDetails() != null
                            ? user.getEmployeeDetails().getStoreId() : "",
                    "role", user.isEmployee() && user.getEmployeeDetails() != null
                            ? user.getEmployeeDetails().getRole() : ""));
        } catch (Exception e) {
            log.error("Permission check failed for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.ok(Map.of("canTakeOrders", false, "error", e.getMessage(), "userId", userId));
        }
    }
}
