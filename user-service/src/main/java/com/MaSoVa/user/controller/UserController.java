package com.MaSoVa.user.controller;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.user.dto.*;
import com.MaSoVa.user.dto.GoogleLoginRequest;
import com.MaSoVa.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User registration, authentication, and management")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private com.MaSoVa.user.service.JwtService jwtService;

    @Autowired
    private com.MaSoVa.user.service.WorkingSessionService workingSessionService;

    // Rate limiting cache: IP -> failed attempt count
    // Expires after 15 minutes
    private final LoadingCache<String, Integer> pinAttempts = CacheBuilder.newBuilder()
            .expireAfterWrite(15, java.util.concurrent.TimeUnit.MINUTES)
            .build(new CacheLoader<String, Integer>() {
                @Override
                public Integer load(String key) {
                    return 0;
                }
            });

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody UserCreateRequest request) {
        LoginResponse response = userService.registerUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create")
    @Operation(summary = "Create new user (admin/manager only)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    @Operation(summary = "User login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/google")
    @Operation(summary = "Sign in or register via Google OAuth ID token")
    public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        LoginResponse response = userService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate-pin")
    @Operation(summary = "Validate employee PIN for order creation and authentication")
    public ResponseEntity<?> validatePIN(
            @RequestBody Map<String, String> request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String pin = request.get("pin");
        String clientIp = getClientIP(httpRequest);

        if (pin == null || pin.length() != 5) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid PIN format. PIN must be 5 digits."));
        }

        try {
            // RATE LIMITING: Check if IP is locked out
            Integer attempts = pinAttempts.getUnchecked(clientIp);
            if (attempts >= 5) {
                logger.warn("PIN validation blocked for IP {} - too many attempts ({})", clientIp, attempts);
                return ResponseEntity.status(429) // Too Many Requests
                    .body(Map.of(
                        "error", "Too many failed attempts. Please try again in 15 minutes.",
                        "lockoutMinutes", 15
                    ));
            }

            // Find user by PIN
            User user = userService.findUserByPIN(pin);

            if (user == null || !user.isEmployee()) {
                // INCREMENT FAILED ATTEMPTS
                pinAttempts.put(clientIp, attempts + 1);
                logger.warn("Invalid PIN attempt from IP {}: {} total attempts", clientIp, attempts + 1);

                return ResponseEntity.status(401)
                    .body(Map.of(
                        "error", "Invalid PIN",
                        "attemptsRemaining", Math.max(0, 5 - (attempts + 1))
                    ));
            }

            // Check if user is active
            if (!user.isActive()) {
                // INCREMENT FAILED ATTEMPTS (inactive account)
                pinAttempts.put(clientIp, attempts + 1);
                logger.warn("PIN validation failed for inactive account from IP {}", clientIp);

                return ResponseEntity.status(401)
                    .body(Map.of("error", "Employee account is inactive"));
            }

            // SUCCESS - Reset attempts
            pinAttempts.invalidate(clientIp);
            logger.info("PIN validated successfully for user {} from IP {}", user.getId(), clientIp);

            // Return user data (no sensitive info)
            return ResponseEntity.ok(Map.of(
                "userId", user.getId(),
                "name", user.getPersonalInfo().getName(),
                "type", user.getType().toString(),
                "role", user.getEmployeeDetails().getRole() != null ? user.getEmployeeDetails().getRole() : "Staff",
                "storeId", user.getEmployeeDetails().getStoreId() != null ? user.getEmployeeDetails().getStoreId() : ""
            ));
        } catch (Exception e) {
            logger.error("Error validating PIN from IP {}: {}", clientIp, e.getMessage());
            return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid PIN"));
        }
    }

    /**
     * Extract real client IP from request (handles proxies)
     */
    private String getClientIP(jakarta.servlet.http.HttpServletRequest request) {
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

    @PostMapping("/logout")
    @Operation(summary = "User logout")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        userService.logout(userId, authHeader);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<Map<String, String>> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        String newAccessToken = userService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
    
    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> getUser(@PathVariable("userId") String userId) {
        UserResponse user = userService.getUserResponseById(userId);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{userId}")
    @Operation(summary = "Update user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("#userId == authentication.name or hasRole('MANAGER')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable("userId") String userId,
            @Valid @RequestBody UserCreateRequest request) {
        UserResponse user = userService.updateUser(userId, request);
        return ResponseEntity.ok(user);
    }
    
    @PostMapping("/{userId}/activate")
    @Operation(summary = "Activate user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable("userId") String userId) {
        userService.activateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PostMapping("/{userId}/deactivate")
    @Operation(summary = "Deactivate user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateUserPost(@PathVariable("userId") String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Deactivate user (deprecated - use POST /deactivate)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable("userId") String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @GetMapping
    @Operation(summary = "Get all users")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get users by type")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getUsersByType(
            @PathVariable("type") UserType type,
            @RequestParam(required = false) String storeId,
            HttpServletRequest request) {

        // If storeId is provided in query params, use it; otherwise extract from headers
        String finalStoreId = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);

        List<UserResponse> users;
        if (finalStoreId != null && !finalStoreId.isEmpty()) {
            users = userService.getUsersByTypeAndStore(type, finalStoreId);
        } else {
            users = userService.getUsersByType(type);
        }
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/store")
    @Operation(summary = "Get store employees")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getStoreEmployees(
            @RequestParam(required = false) String storeId,
            HttpServletRequest request) {
        // Extract storeId from query param or headers
        String finalStoreId = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);
        logger.info("GET /api/users/store - Fetching employees for storeId: {}", finalStoreId);
        if (finalStoreId == null || finalStoreId.isEmpty()) {
            logger.warn("GET /api/users/store - No storeId found in headers or query params");
            return ResponseEntity.badRequest().body(null);
        }
        List<UserResponse> employees = userService.getStoreEmployees(finalStoreId);
        logger.info("GET /api/users/store - Found {} employees for store {}", employees.size(), finalStoreId);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/managers")
    @Operation(summary = "Get active managers")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<UserResponse>> getActiveManagers() {
        List<UserResponse> managers = userService.getActiveManagers();
        return ResponseEntity.ok(managers);
    }
    
    // FIX 4: Completely rewritten permission check method
    @GetMapping("/{userId}/can-take-orders")
    @Operation(summary = "Check if user can take orders")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> canTakeOrders(@PathVariable("userId") String userId) {
        try {
            // Use the service method that doesn't use problematic caching
            boolean canTakeOrders = userService.canUserTakeOrders(userId);
            
            // Get user data for additional context (avoid cache if needed)
            User user = userService.getUserById(userId);
            
            Map<String, Object> response = Map.of(
                "canTakeOrders", canTakeOrders,
                "userType", user.getType().toString(),
                "isEmployee", user.isEmployee(),
                "isActive", user.isActive(),
                "userId", userId,
                "storeId", user.isEmployee() && user.getEmployeeDetails() != null ? 
                          user.getEmployeeDetails().getStoreId() : null,
                "role", user.isEmployee() && user.getEmployeeDetails() != null ? 
                        user.getEmployeeDetails().getRole() : null
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Comprehensive error handling
            Map<String, Object> errorResponse = Map.of(
                "canTakeOrders", false,
                "error", e.getMessage(),
                "errorType", e.getClass().getSimpleName(),
                "userId", userId
            );
            
            // Log the full error for debugging
            logger.error("Permission check failed for user {}: {}", userId, e.getMessage(), e);

            return ResponseEntity.ok(errorResponse);
        }
    }
    
    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> getCurrentUserProfile(@RequestHeader("X-User-Id") String userId) {
        UserResponse user = userService.getUserResponseById(userId);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/profile")
    @Operation(summary = "Update current user profile")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UserCreateRequest request) {
        UserResponse user = userService.updateUser(userId, request);
        return ResponseEntity.ok(user);
    }
    
    @PostMapping("/change-password")
    @Operation(summary = "Change user password")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        userService.changePassword(userId, currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search users")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> searchUsers(
            HttpServletRequest request,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) UserType type) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        List<UserResponse> users = userService.searchUsers(name, email, phone, type, storeId);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get user statistics")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserStats(
            @RequestParam(required = false) String storeId,
            HttpServletRequest request) {

        // Extract storeId from query param or headers
        String finalStoreId = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);

        Map<String, Object> stats;
        if (finalStoreId != null && !finalStoreId.isEmpty()) {
            stats = userService.getDriverStatsByStore(finalStoreId);
        } else {
            stats = userService.getUserStatistics();
        }
        return ResponseEntity.ok(stats);
    }

    // Analytics endpoints
    @GetMapping("/drivers/store")
    @Operation(summary = "Get drivers by store")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<UserResponse>> getDriversByStore(
            @RequestParam(required = false) String storeId,
            HttpServletRequest request) {
        // Extract storeId from query param or headers
        String finalStoreId = storeId != null ? storeId : StoreContextUtil.getStoreIdFromHeaders(request);
        if (finalStoreId == null || finalStoreId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        logger.info("Fetching drivers for store: {}", finalStoreId);
        List<UserResponse> drivers = userService.getDriversByStore(finalStoreId);
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/drivers/available")
    @Operation(summary = "Get available drivers by store")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<UserResponse>> getAvailableDrivers(@RequestParam String storeId) {
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        logger.info("Fetching available drivers for store: {}", storeId);
        List<UserResponse> drivers = userService.getAvailableDrivers(storeId);
        return ResponseEntity.ok(drivers);
    }

    // ==================== DRIVER STATUS ENDPOINTS (PHASE 8) ====================

    /**
     * Update driver online/offline status
     * PUT /api/users/{userId}/status
     * Phase 8: Persist driver status across page refreshes
     */
    @PutMapping("/{userId}/status")
    @Operation(summary = "Update driver status")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> updateDriverStatus(
            @PathVariable("userId") String userId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");

        logger.info("PUT /api/users/{}/status - Updating status to: {}", userId, status);

        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Status is required"
            ));
        }

        // Validate status value
        if (!status.equals("AVAILABLE") && !status.equals("OFF_DUTY") &&
            !status.equals("ON_DUTY") && !status.equals("BUSY")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid status value"
            ));
        }

        try {
            userService.updateDriverStatus(userId, status);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "status", status,
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            logger.error("Error updating driver status: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to update driver status: " + e.getMessage()
            ));
        }
    }

    /**
     * Get driver's current status
     * GET /api/users/{userId}/status
     * Phase 8: Retrieve persisted driver status on page load
     */
    @GetMapping("/{userId}/status")
    @Operation(summary = "Get driver status")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getDriverStatus(@PathVariable("userId") String userId) {
        logger.info("GET /api/users/{}/status", userId);

        try {
            // Bypass cache to avoid LinkedHashMap casting issue - call repository directly
            User user = userService.getUserByIdUncached(userId);

            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if user is a driver
            if (user.getType() != UserType.DRIVER) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "User is not a driver"
                ));
            }

            String status = user.getEmployeeDetails() != null
                    ? user.getEmployeeDetails().getStatus()
                    : "OFF_DUTY";

            // Default to OFF_DUTY if status is null
            if (status == null || status.isEmpty()) {
                status = "OFF_DUTY";
            }

            // Check if driver has an active working session
            // If there's an active session, they should be considered online
            boolean hasActiveSession = workingSessionService.isEmployeeCurrentlyWorking(userId);
            boolean isOnline = "AVAILABLE".equals(status) || hasActiveSession;

            logger.info("Driver status check: userId={}, status={}, hasActiveSession={}, isOnline={}",
                userId, status, hasActiveSession, isOnline);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "status", status,
                    "isOnline", isOnline,
                    "hasActiveSession", hasActiveSession
            ));
        } catch (Exception e) {
            logger.error("Error fetching driver status: {}", e.getMessage(), e);
            // Return default status on error
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "status", "OFF_DUTY",
                    "isOnline", false
            ));
        }
    }

    // ==================== PIN MANAGEMENT ENDPOINTS (PHASE 2) ====================

    /**
     * Generate PIN for a specific employee
     * POST /api/users/{userId}/generate-pin
     * Phase 2: Manager can generate/reset employee PIN
     */
    @PostMapping("/{userId}/generate-pin")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    @Operation(summary = "Generate 4-digit PIN for employee")
    public ResponseEntity<Map<String, String>> generateEmployeePIN(@PathVariable String userId) {
        logger.info("POST /api/users/{}/generate-pin", userId);

        try {
            String pin = userService.generateEmployeePIN(userId);

            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "message", "PIN generated successfully",
                    "userId", userId,
                    "pin", pin,
                    "note", "Please share this PIN with the employee. It will not be shown again."
            ));
        } catch (Exception e) {
            logger.error("Error generating PIN for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Generate PINs for all employees (migration utility)
     * POST /api/users/generate-all-pins
     * Phase 2: One-time migration to generate PINs for existing employees
     */
    @PostMapping("/generate-all-pins")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Generate PINs for all employees without PINs (migration)")
    public ResponseEntity<Map<String, Object>> generateAllEmployeePINs() {
        logger.info("POST /api/users/generate-all-pins");

        try {
            Map<String, String> results = userService.generatePINsForAllEmployees();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PIN generation completed",
                    "totalProcessed", results.size(),
                    "results", results,
                    "note", "Please save these PINs and distribute to employees. They will not be shown again."
            ));
        } catch (Exception e) {
            logger.error("Error generating PINs for all employees: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // ==================== KIOSK MANAGEMENT ENDPOINTS ====================

    /**
     * Create a kiosk account for a POS terminal
     * POST /api/users/kiosk/create
     * Manager-only: Create kiosk account for a specific terminal
     */
    @PostMapping("/kiosk/create")
    @Operation(summary = "Create kiosk account for POS terminal")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> createKioskAccount(
            @RequestHeader("X-User-Id") String managerId,
            @RequestBody Map<String, String> request) {

        String storeId = request.get("storeId");
        String terminalId = request.get("terminalId");

        logger.info("POST /api/users/kiosk/create - Manager {} creating kiosk for store {} terminal {}",
                    managerId, storeId, terminalId);

        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Store ID is required"
            ));
        }

        if (terminalId == null || terminalId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Terminal ID is required"
            ));
        }

        try {
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
                "expiresIn", "30 days",
                "instructions", "Copy these tokens and configure them in the POS terminal settings"
            ));
        } catch (Exception e) {
            logger.error("Error creating kiosk account: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Get all kiosk accounts for a store
     * GET /api/users/kiosk/list
     */
    @GetMapping("/kiosk/list")
    @Operation(summary = "List kiosk accounts for a store")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> listKioskAccounts(
            @RequestParam String storeId,
            HttpServletRequest request) {

        logger.info("GET /api/users/kiosk/list for store {}", storeId);

        List<UserResponse> kiosks = userService.getKioskAccountsByStore(storeId);
        return ResponseEntity.ok(kiosks);
    }

    /**
     * Regenerate tokens for a kiosk account
     * POST /api/users/kiosk/{kioskUserId}/regenerate-tokens
     */
    @PostMapping("/kiosk/{kioskUserId}/regenerate-tokens")
    @Operation(summary = "Regenerate tokens for kiosk account")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> regenerateKioskTokens(
            @PathVariable String kioskUserId,
            @RequestHeader("X-User-Id") String managerId) {

        logger.info("POST /api/users/kiosk/{}/regenerate-tokens by manager {}", kioskUserId, managerId);

        try {
            LoginResponse tokens = userService.generateKioskTokens(kioskUserId);
            User kiosk = userService.getUserById(kioskUserId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Kiosk tokens regenerated successfully",
                "accessToken", tokens.getAccessToken(),
                "refreshToken", tokens.getRefreshToken(),
                "terminalId", kiosk.getEmployeeDetails().getTerminalId(),
                "expiresIn", "30 days"
            ));
        } catch (Exception e) {
            logger.error("Error regenerating kiosk tokens: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Deactivate a kiosk account
     * POST /api/users/kiosk/{kioskUserId}/deactivate
     */
    @PostMapping("/kiosk/{kioskUserId}/deactivate")
    @Operation(summary = "Deactivate kiosk account")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateKiosk(
            @PathVariable String kioskUserId,
            @RequestHeader("X-User-Id") String managerId) {

        logger.info("POST /api/users/kiosk/{}/deactivate by manager {}", kioskUserId, managerId);

        try {
            userService.deactivateKioskAccount(kioskUserId, managerId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Kiosk account deactivated successfully"
            ));
        } catch (Exception e) {
            logger.error("Error deactivating kiosk: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Auto-login endpoint for kiosk mode
     * POST /api/users/kiosk/auto-login
     * Public endpoint - validates kiosk token and returns fresh tokens if needed
     */
    @PostMapping("/kiosk/auto-login")
    @Operation(summary = "Auto-login for kiosk terminals")
    public ResponseEntity<Map<String, Object>> kioskAutoLogin(
            @RequestBody Map<String, String> request) {

        String kioskToken = request.get("kioskToken");

        logger.info("POST /api/users/kiosk/auto-login");

        if (kioskToken == null || kioskToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Kiosk token is required"
            ));
        }

        try {
            // Validate kiosk token
            if (!jwtService.isKioskToken(kioskToken)) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Invalid kiosk token"
                ));
            }

            String userId = jwtService.extractUserId(kioskToken);
            User kiosk = userService.getUserById(userId);

            if (kiosk.getType() != UserType.KIOSK) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Invalid kiosk account"
                ));
            }

            if (!kiosk.isActive()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Kiosk account is deactivated"
                ));
            }

            // Check if token is expired or will expire soon (within 24 hours)
            Date expiration = jwtService.extractExpiration(kioskToken);
            long hoursUntilExpiry = (expiration.getTime() - System.currentTimeMillis()) / (1000 * 60 * 60);

            boolean shouldRefresh = hoursUntilExpiry < 24;

            if (shouldRefresh) {
                // Generate fresh tokens
                LoginResponse tokens = userService.generateKioskTokens(userId);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tokensRefreshed", true,
                    "accessToken", tokens.getAccessToken(),
                    "refreshToken", tokens.getRefreshToken(),
                    "user", tokens.getUser()
                ));
            } else {
                // Token is still valid, return user data
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tokensRefreshed", false,
                    "user", userService.mapToUserResponse(kiosk)
                ));
            }

        } catch (Exception e) {
            logger.error("Kiosk auto-login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "error", "Auto-login failed: " + e.getMessage()
            ));
        }
    }
}