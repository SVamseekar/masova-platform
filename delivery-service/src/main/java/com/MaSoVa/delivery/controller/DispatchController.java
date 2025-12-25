package com.MaSoVa.delivery.controller;

import com.MaSoVa.delivery.client.UserServiceClient;
import com.MaSoVa.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.delivery.dto.DeliveryFeeResponse;
import com.MaSoVa.delivery.dto.RouteOptimizationRequest;
import com.MaSoVa.delivery.dto.RouteOptimizationResponse;
import com.MaSoVa.delivery.service.AutoDispatchService;
import com.MaSoVa.delivery.service.DeliveryZoneService;
import com.MaSoVa.delivery.service.RouteOptimizationService;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

/**
 * REST Controller for dispatch and route optimization
 */
@RestController
@Tag(name = "Delivery Dispatch", description = "APIs for auto-dispatch and route optimization")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/delivery")
public class DispatchController {

    private static final Logger log = LoggerFactory.getLogger(DispatchController.class);

    private final AutoDispatchService autoDispatchService;
    private final RouteOptimizationService routeOptimizationService;
    private final DeliveryZoneService deliveryZoneService;
    private final UserServiceClient userServiceClient;

    public DispatchController(AutoDispatchService autoDispatchService,
                              RouteOptimizationService routeOptimizationService,
                              DeliveryZoneService deliveryZoneService,
                              UserServiceClient userServiceClient) {
        this.autoDispatchService = autoDispatchService;
        this.routeOptimizationService = routeOptimizationService;
        this.deliveryZoneService = deliveryZoneService;
        this.userServiceClient = userServiceClient;
    }

    /**
     * Extract storeId from HTTP headers
     * Week 4: Now actively used for store isolation
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        // Managers/Customers use selected store
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }

        // Staff/Driver use assigned store
        return userStoreId;
    }

    /**
     * Auto-assign driver to an order
     * POST /api/delivery/auto-dispatch
     * Week 4: Added store validation to prevent cross-store dispatch
     */
    @PostMapping("/auto-dispatch")
    public ResponseEntity<AutoDispatchResponse> autoDispatch(
            @Valid @RequestBody AutoDispatchRequest request,
            HttpServletRequest httpRequest
    ) {
        log.info("POST /api/delivery/auto-dispatch for order: {} in store: {}",
                request.getOrderId(), request.getStoreId());

        // Validate that request storeId matches user's authorized store
        String authorizedStoreId = getStoreIdFromHeaders(httpRequest);
        if (authorizedStoreId == null || authorizedStoreId.isEmpty()) {
            log.error("Missing storeId in request headers");
            throw new RuntimeException("Store ID is required in headers");
        }

        if (!authorizedStoreId.equals(request.getStoreId())) {
            log.error("Store ID mismatch: authorized={}, requested={}",
                    authorizedStoreId, request.getStoreId());
            throw new RuntimeException("You are not authorized to dispatch drivers for this store");
        }

        try {
            AutoDispatchResponse response = autoDispatchService.autoDispatch(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error in auto-dispatch: {}", e.getMessage());
            throw new RuntimeException("Failed to dispatch driver: " + e.getMessage());
        }
    }

    /**
     * Get optimized route between two locations
     * POST /api/delivery/route-optimize
     */
    @PostMapping("/route-optimize")
    public ResponseEntity<RouteOptimizationResponse> optimizeRoute(@Valid @RequestBody RouteOptimizationRequest request) {
        log.info("POST /api/delivery/route-optimize");

        try {
            RouteOptimizationResponse response = routeOptimizationService.getOptimizedRoute(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error optimizing route: {}", e.getMessage());
            throw new RuntimeException("Failed to optimize route: " + e.getMessage());
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Delivery Service - Dispatch Controller is running");
    }

    /**
     * Get available drivers for manual assignment
     * GET /api/delivery/drivers/available?storeId=xxx
     */
    @GetMapping("/drivers/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDrivers(
            @RequestParam String storeId,
            HttpServletRequest httpRequest) {
        log.info("GET /api/delivery/drivers/available for store: {}", storeId);

        // Note: Managers can view drivers for any store they have access to
        // Store authorization is handled by role-based access control (MANAGER role required)

        try {
            List<Map<String, Object>> drivers = userServiceClient.getAvailableDrivers(storeId);
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            log.error("Error fetching available drivers: {}", e.getMessage());
            return ResponseEntity.ok(List.of()); // Return empty list on error
        }
    }

    // ==================== DELIVERY ZONE ENDPOINTS (DELIV-005) ====================

    /**
     * Check if delivery address is within store's service area
     * GET /api/delivery/zone/check?storeId=xxx&lat=xxx&lng=xxx
     */
    @GetMapping("/zone/check")
    public ResponseEntity<Map<String, Object>> checkDeliveryZone(
            @RequestParam String storeId,
            @RequestParam double lat,
            @RequestParam double lng) {
        log.info("GET /api/delivery/zone/check for store: {}", storeId);

        try {
            boolean isWithin = deliveryZoneService.isWithinDeliveryZone(storeId, lat, lng);
            return ResponseEntity.ok(Map.of(
                    "storeId", storeId,
                    "latitude", lat,
                    "longitude", lng,
                    "isWithinDeliveryZone", isWithin
            ));
        } catch (Exception e) {
            log.error("Error checking delivery zone: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "isWithinDeliveryZone", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Calculate delivery fee for a location
     * GET /api/delivery/zone/fee?storeId=xxx&lat=xxx&lng=xxx
     */
    @GetMapping("/zone/fee")
    public ResponseEntity<DeliveryFeeResponse> calculateDeliveryFee(
            @RequestParam String storeId,
            @RequestParam double lat,
            @RequestParam double lng) {
        log.info("GET /api/delivery/zone/fee for store: {}", storeId);

        try {
            DeliveryFeeResponse response = deliveryZoneService.calculateDeliveryFee(storeId, lat, lng);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating delivery fee: {}", e.getMessage());
            return ResponseEntity.ok(DeliveryFeeResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all delivery zones for a store
     * GET /api/delivery/zone/list?storeId=xxx
     */
    @GetMapping("/zone/list")
    public ResponseEntity<List<Map<String, Object>>> getDeliveryZones(@RequestParam String storeId) {
        log.info("GET /api/delivery/zone/list for store: {}", storeId);

        try {
            List<Map<String, Object>> zones = deliveryZoneService.getDeliveryZones(storeId);
            return ResponseEntity.ok(zones);
        } catch (Exception e) {
            log.error("Error getting delivery zones: {}", e.getMessage());
            throw new RuntimeException("Failed to get delivery zones: " + e.getMessage());
        }
    }

    /**
     * Validate delivery address (comprehensive check)
     * GET /api/delivery/zone/validate?storeId=xxx&lat=xxx&lng=xxx&pincode=xxx
     */
    @GetMapping("/zone/validate")
    public ResponseEntity<DeliveryZoneService.ValidationResult> validateDeliveryAddress(
            @RequestParam String storeId,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) String pincode) {
        log.info("GET /api/delivery/zone/validate for store: {}", storeId);

        try {
            DeliveryZoneService.ValidationResult result = deliveryZoneService.validateDeliveryAddress(
                    storeId, lat, lng, pincode);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error validating delivery address: {}", e.getMessage());
            DeliveryZoneService.ValidationResult errorResult = new DeliveryZoneService.ValidationResult();
            errorResult.setValid(false);
            errorResult.setError(e.getMessage());
            return ResponseEntity.ok(errorResult);
        }
    }

    // ==================== DRIVER STATUS ENDPOINTS (PHASE 8) ====================

    /**
     * Update driver online/offline status
     * PUT /api/delivery/driver/status
     * Phase 8: Persist driver status across page refreshes
     */
    @PutMapping("/driver/status")
    public ResponseEntity<Map<String, Object>> updateDriverStatus(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String driverId = request.get("driverId");
        String status = request.get("status"); // "AVAILABLE" or "OFF_DUTY"

        log.info("PUT /api/delivery/driver/status - driverId: {}, status: {}", driverId, status);

        if (driverId == null || status == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "driverId and status are required"
            ));
        }

        // Validate status value
        if (!status.equals("AVAILABLE") && !status.equals("OFF_DUTY")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Status must be either AVAILABLE or OFF_DUTY"
            ));
        }

        try {
            // Phase 2: Validate that driver has active working session before going online
            if (status.equals("AVAILABLE")) {
                try {
                    Map<String, Object> sessionStatus = userServiceClient.getEmployeeWorkingStatus(driverId);
                    Boolean isWorking = (Boolean) sessionStatus.get("isWorking");

                    if (isWorking == null || !isWorking) {
                        log.warn("Driver {} attempted to go online without active working session", driverId);
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "success", false,
                                "error", "You must be clocked in by a manager before going online",
                                "requiresClockIn", true
                        ));
                    }
                } catch (Exception e) {
                    log.error("Error checking working session for driver {}: {}", driverId, e.getMessage());
                    // Allow to proceed if session check fails (to avoid blocking drivers)
                }
            }

            // Update driver status via UserServiceClient
            userServiceClient.updateDriverStatus(driverId, status);

            log.info("Driver {} status updated to: {}", driverId, status);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "driverId", driverId,
                    "status", status,
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Error updating driver status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Failed to update driver status: " + e.getMessage()
            ));
        }
    }

    /**
     * Get current driver status
     * GET /api/delivery/driver/{driverId}/status
     * Phase 8: Retrieve persisted driver status on page load
     */
    @GetMapping("/driver/{driverId}/status")
    public ResponseEntity<Map<String, Object>> getDriverStatus(@PathVariable String driverId) {
        log.info("GET /api/delivery/driver/{}/status", driverId);

        try {
            // Fetch driver status from UserServiceClient
            String status = userServiceClient.getDriverStatus(driverId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "driverId", driverId,
                    "status", status != null ? status : "OFF_DUTY",
                    "isOnline", "AVAILABLE".equals(status)
            ));
        } catch (Exception e) {
            log.error("Error fetching driver status: {}", e.getMessage());
            // Return default status on error
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "driverId", driverId,
                    "status", "OFF_DUTY",
                    "isOnline", false
            ));
        }
    }
}
