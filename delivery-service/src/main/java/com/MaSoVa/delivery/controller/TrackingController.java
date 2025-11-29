package com.MaSoVa.delivery.controller;

import com.MaSoVa.delivery.dto.ETAResponse;
import com.MaSoVa.delivery.dto.LocationUpdateRequest;
import com.MaSoVa.delivery.dto.TrackingResponse;
import com.MaSoVa.delivery.service.ETACalculationService;
import com.MaSoVa.delivery.service.LiveTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for live tracking and location updates
 */
@RestController
@RequestMapping("/api/delivery")
public class TrackingController {

    private static final Logger log = LoggerFactory.getLogger(TrackingController.class);

    private final LiveTrackingService liveTrackingService;
    private final ETACalculationService etaCalculationService;

    public TrackingController(LiveTrackingService liveTrackingService, ETACalculationService etaCalculationService) {
        this.liveTrackingService = liveTrackingService;
        this.etaCalculationService = etaCalculationService;
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
     * Driver pushes location update
     * POST /api/delivery/location-update
     */
    @PostMapping("/location-update")
    public ResponseEntity<String> updateLocation(@Valid @RequestBody LocationUpdateRequest request) {
        log.info("POST /api/delivery/location-update for driver: {}", request.getDriverId());

        try {
            liveTrackingService.updateDriverLocation(request);
            return ResponseEntity.ok("Location updated successfully");
        } catch (Exception e) {
            log.error("Error updating location: {}", e.getMessage());
            throw new RuntimeException("Failed to update location: " + e.getMessage());
        }
    }

    /**
     * Customer tracks order delivery
     * GET /api/delivery/track/{orderId}
     */
    @GetMapping("/track/{orderId}")
    public ResponseEntity<TrackingResponse> trackOrder(@PathVariable String orderId) {
        log.info("GET /api/delivery/track/{}", orderId);

        try {
            TrackingResponse response = liveTrackingService.getOrderTracking(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error tracking order: {}", e.getMessage());
            throw new RuntimeException("Failed to get tracking info: " + e.getMessage());
        }
    }

    /**
     * Get ETA for an order
     * GET /api/delivery/eta/{orderId}
     */
    @GetMapping("/eta/{orderId}")
    public ResponseEntity<ETAResponse> getETA(@PathVariable String orderId) {
        log.info("GET /api/delivery/eta/{}", orderId);

        try {
            ETAResponse response = etaCalculationService.calculateETA(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating ETA: {}", e.getMessage());
            throw new RuntimeException("Failed to calculate ETA: " + e.getMessage());
        }
    }
}
