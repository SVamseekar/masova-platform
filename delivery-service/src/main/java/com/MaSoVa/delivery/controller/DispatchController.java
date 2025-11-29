package com.MaSoVa.delivery.controller;

import com.MaSoVa.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.delivery.dto.RouteOptimizationRequest;
import com.MaSoVa.delivery.dto.RouteOptimizationResponse;
import com.MaSoVa.delivery.service.AutoDispatchService;
import com.MaSoVa.delivery.service.RouteOptimizationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for dispatch and route optimization
 */
@RestController
@RequestMapping("/api/delivery")
public class DispatchController {

    private static final Logger log = LoggerFactory.getLogger(DispatchController.class);

    private final AutoDispatchService autoDispatchService;
    private final RouteOptimizationService routeOptimizationService;

    public DispatchController(AutoDispatchService autoDispatchService, RouteOptimizationService routeOptimizationService) {
        this.autoDispatchService = autoDispatchService;
        this.routeOptimizationService = routeOptimizationService;
    }

    /**
     * Extract storeId from HTTP headers
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
     */
    @PostMapping("/auto-dispatch")
    public ResponseEntity<AutoDispatchResponse> autoDispatch(@Valid @RequestBody AutoDispatchRequest request) {
        log.info("POST /api/delivery/auto-dispatch for order: {}", request.getOrderId());

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
}
