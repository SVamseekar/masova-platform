package com.MaSoVa.user.controller;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.user.dto.*;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User registration, authentication, and management")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody UserCreateRequest request) {
        LoginResponse response = userService.registerUser(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    @Operation(summary = "User login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.authenticate(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    @Operation(summary = "User logout")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("X-User-Id") String userId) {
        userService.logout(userId);
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
    
    @DeleteMapping("/{userId}")
    @Operation(summary = "Deactivate user")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable("userId") String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Get users by type")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getUsersByType(@PathVariable("type") UserType type) {
        List<UserResponse> users = userService.getUsersByType(type);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/store")
    @Operation(summary = "Get store employees")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<List<UserResponse>> getStoreEmployees(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        List<UserResponse> employees = userService.getStoreEmployees(storeId);
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
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> stats = userService.getUserStatistics();
        return ResponseEntity.ok(stats);
    }

    // Analytics endpoints
    @GetMapping("/drivers/store")
    @Operation(summary = "Get drivers by store")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<UserResponse>> getDriversByStore(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        logger.info("Fetching drivers for store: {}", storeId);
        List<UserResponse> drivers = userService.getDriversByStore(storeId);
        return ResponseEntity.ok(drivers);
    }
}