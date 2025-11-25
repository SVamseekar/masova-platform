package com.MaSoVa.delivery.controller;

import com.MaSoVa.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.delivery.dto.RouteOptimizationRequest;
import com.MaSoVa.delivery.dto.RouteOptimizationResponse;
import com.MaSoVa.delivery.service.AutoDispatchService;
import com.MaSoVa.delivery.service.RouteOptimizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for dispatch and route optimization
 */
@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@Slf4j
public class DispatchController {

    private final AutoDispatchService autoDispatchService;
    private final RouteOptimizationService routeOptimizationService;

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
