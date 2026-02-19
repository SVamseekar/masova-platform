package com.MaSoVa.logistics.delivery.controller;

import com.MaSoVa.logistics.delivery.dto.DeliveryMetricsResponse;
import com.MaSoVa.logistics.delivery.dto.DriverPerformanceResponse;
import com.MaSoVa.logistics.delivery.service.PerformanceService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.time.LocalDate;

/**
 * REST Controller for driver performance analytics
 */
@RestController
@Tag(name = "Delivery Performance", description = "APIs for driver performance analytics")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/delivery")
public class PerformanceController {

    private static final Logger log = LoggerFactory.getLogger(PerformanceController.class);

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
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
     * Get driver performance metrics
     * GET /api/delivery/driver/{driverId}/performance
     * Week 4: Added store validation
     */
    @GetMapping("/driver/{driverId}/performance")
    public ResponseEntity<DriverPerformanceResponse> getDriverPerformance(
            @PathVariable String driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request
    ) {
        log.info("GET /api/delivery/driver/{}/performance", driverId);

        // Get storeId from headers for store isolation
        String storeId = getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            log.error("Missing storeId in request headers");
            throw new RuntimeException("Store ID is required");
        }

        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        try {
            DriverPerformanceResponse response = performanceService.getDriverPerformance(driverId, storeId, startDate, endDate);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching driver performance: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get driver performance: " + e.getMessage(), e);
        }
    }

    /**
     * Get today's performance for a driver
     * GET /api/delivery/driver/{driverId}/performance/today
     * Week 4: Added store validation
     */
    @GetMapping("/driver/{driverId}/performance/today")
    public ResponseEntity<DriverPerformanceResponse> getTodayPerformance(
            @PathVariable String driverId,
            HttpServletRequest request
    ) {
        log.info("GET /api/delivery/driver/{}/performance/today", driverId);

        // Get storeId from headers for store isolation
        String storeId = getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            log.error("Missing storeId in request headers");
            throw new RuntimeException("Store ID is required");
        }

        try {
            LocalDate today = LocalDate.now();
            DriverPerformanceResponse response = performanceService.getDriverPerformance(driverId, storeId, today, today);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching today's performance: {}", e.getMessage());
            throw new RuntimeException("Failed to get today's performance: " + e.getMessage());
        }
    }

    /**
     * Get today's overall delivery metrics
     * GET /api/delivery/metrics/today
     * Week 4: Added store validation
     */
    @GetMapping("/metrics/today")
    public ResponseEntity<DeliveryMetricsResponse> getTodayMetrics(HttpServletRequest request) {
        log.info("GET /api/delivery/metrics/today");

        // Get storeId from headers for store isolation
        String storeId = getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            log.error("Missing storeId in request headers");
            throw new RuntimeException("Store ID is required");
        }

        try {
            DeliveryMetricsResponse response = performanceService.getTodayMetrics(storeId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching today's metrics", e);
            throw new RuntimeException("Failed to get today's metrics: " + e.getMessage(), e);
        }
    }
}
