package com.MaSoVa.delivery.controller;

import com.MaSoVa.delivery.dto.DriverPerformanceResponse;
import com.MaSoVa.delivery.service.PerformanceService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST Controller for driver performance analytics
 */
@RestController
@RequestMapping("/api/delivery")
public class PerformanceController {

    private static final Logger log = LoggerFactory.getLogger(PerformanceController.class);

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
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
     * Get driver performance metrics
     * GET /api/delivery/driver/{driverId}/performance
     */
    @GetMapping("/driver/{driverId}/performance")
    public ResponseEntity<DriverPerformanceResponse> getDriverPerformance(
            @PathVariable String driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        log.info("GET /api/delivery/driver/{}/performance", driverId);

        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        try {
            DriverPerformanceResponse response = performanceService.getDriverPerformance(driverId, startDate, endDate);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching driver performance: {}", e.getMessage());
            throw new RuntimeException("Failed to get driver performance: " + e.getMessage());
        }
    }

    /**
     * Get today's performance for a driver
     * GET /api/delivery/driver/{driverId}/performance/today
     */
    @GetMapping("/driver/{driverId}/performance/today")
    public ResponseEntity<DriverPerformanceResponse> getTodayPerformance(@PathVariable String driverId) {
        log.info("GET /api/delivery/driver/{}/performance/today", driverId);

        try {
            LocalDate today = LocalDate.now();
            DriverPerformanceResponse response = performanceService.getDriverPerformance(driverId, today, today);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching today's performance: {}", e.getMessage());
            throw new RuntimeException("Failed to get today's performance: " + e.getMessage());
        }
    }
}
