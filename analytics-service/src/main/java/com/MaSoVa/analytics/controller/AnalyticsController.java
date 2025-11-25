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
     * Get sales trends (weekly or monthly)
     * GET /api/analytics/sales/trends/{period}?storeId={storeId}
     * @param period "WEEKLY" or "MONTHLY"
     */
    @GetMapping("/sales/trends/{period}")
    public ResponseEntity<SalesTrendResponse> getSalesTrends(
            @PathVariable String period,
            @RequestParam(defaultValue = "store-001") String storeId) {
        log.info("GET /api/analytics/sales/trends/{} for store {}", period, storeId);
        SalesTrendResponse trends = analyticsService.getSalesTrends(storeId, period);
        return ResponseEntity.ok(trends);
    }

    /**
     * Get order type breakdown
     * GET /api/analytics/sales/breakdown/order-type?storeId={storeId}
     */
    @GetMapping("/sales/breakdown/order-type")
    public ResponseEntity<OrderTypeBreakdownResponse> getOrderTypeBreakdown(
            @RequestParam(defaultValue = "store-001") String storeId) {
        log.info("GET /api/analytics/sales/breakdown/order-type for store {}", storeId);
        OrderTypeBreakdownResponse breakdown = analyticsService.getOrderTypeBreakdown(storeId);
        return ResponseEntity.ok(breakdown);
    }

    /**
     * Get peak hours analysis
     * GET /api/analytics/sales/peak-hours?storeId={storeId}
     */
    @GetMapping("/sales/peak-hours")
    public ResponseEntity<PeakHoursResponse> getPeakHours(
            @RequestParam(defaultValue = "store-001") String storeId) {
        log.info("GET /api/analytics/sales/peak-hours for store {}", storeId);
        PeakHoursResponse peakHours = analyticsService.getPeakHours(storeId);
        return ResponseEntity.ok(peakHours);
    }

    /**
     * Get staff leaderboard
     * GET /api/analytics/staff/leaderboard?storeId={storeId}&period={period}
     * @param period "TODAY", "WEEK", or "MONTH"
     */
    @GetMapping("/staff/leaderboard")
    public ResponseEntity<StaffLeaderboardResponse> getStaffLeaderboard(
            @RequestParam(defaultValue = "store-001") String storeId,
            @RequestParam(defaultValue = "TODAY") String period) {
        log.info("GET /api/analytics/staff/leaderboard for store {}, period {}", storeId, period);
        StaffLeaderboardResponse leaderboard = analyticsService.getStaffLeaderboard(storeId, period);
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * Get top selling products
     * GET /api/analytics/products/top-selling?storeId={storeId}&period={period}&sortBy={sortBy}
     * @param period "TODAY", "WEEK", or "MONTH"
     * @param sortBy "QUANTITY" or "REVENUE"
     */
    @GetMapping("/products/top-selling")
    public ResponseEntity<TopProductsResponse> getTopProducts(
            @RequestParam(defaultValue = "store-001") String storeId,
            @RequestParam(defaultValue = "TODAY") String period,
            @RequestParam(defaultValue = "QUANTITY") String sortBy) {
        log.info("GET /api/analytics/products/top-selling for store {}, period {}, sortBy {}", storeId, period, sortBy);
        TopProductsResponse topProducts = analyticsService.getTopProducts(storeId, period, sortBy);
        return ResponseEntity.ok(topProducts);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Analytics Service is running");
    }
}
