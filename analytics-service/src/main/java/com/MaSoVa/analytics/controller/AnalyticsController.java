package com.MaSoVa.analytics.controller;

import com.MaSoVa.analytics.dto.*;
import com.MaSoVa.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API endpoints for analytics and reporting
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get today's sales metrics with comparisons
     * GET /api/analytics/store/{storeId}/sales/today
     */
    @GetMapping("/store/{storeId}/sales/today")
    public ResponseEntity<SalesMetricsResponse> getTodaySalesMetrics(@PathVariable String storeId) {
        log.info("GET /api/analytics/store/{}/sales/today", storeId);
        SalesMetricsResponse metrics = analyticsService.getTodaySalesMetrics(storeId);
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get average order value for today
     * GET /api/analytics/store/{storeId}/avgOrderValue/today
     */
    @GetMapping("/store/{storeId}/avgOrderValue/today")
    public ResponseEntity<AverageOrderValueResponse> getAverageOrderValue(@PathVariable String storeId) {
        log.info("GET /api/analytics/store/{}/avgOrderValue/today", storeId);
        AverageOrderValueResponse aov = analyticsService.getAverageOrderValue(storeId);
        return ResponseEntity.ok(aov);
    }

    /**
     * Get driver status for a store
     * GET /api/analytics/drivers/status/{storeId}
     */
    @GetMapping("/drivers/status/{storeId}")
    public ResponseEntity<DriverStatusResponse> getDriverStatus(@PathVariable String storeId) {
        log.info("GET /api/analytics/drivers/status/{}", storeId);
        DriverStatusResponse status = analyticsService.getDriverStatus(storeId);
        return ResponseEntity.ok(status);
    }

    /**
     * Get staff performance metrics
     * GET /api/analytics/staff/{staffId}/performance/today
     */
    @GetMapping("/staff/{staffId}/performance/today")
    public ResponseEntity<StaffPerformanceResponse> getStaffPerformance(@PathVariable String staffId) {
        log.info("GET /api/analytics/staff/{}/performance/today", staffId);
        StaffPerformanceResponse performance = analyticsService.getStaffPerformance(staffId);
        return ResponseEntity.ok(performance);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Analytics Service is running");
    }
}
