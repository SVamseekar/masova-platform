package com.MaSoVa.analytics.controller;

import com.MaSoVa.analytics.dto.*;
import com.MaSoVa.analytics.service.AnalyticsService;
import com.MaSoVa.shared.util.StoreContextUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

/**
 * REST API endpoints for analytics and reporting
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get today's sales metrics with comparisons
     * GET /api/analytics/sales/today
     */
    @GetMapping("/sales/today")
    public ResponseEntity<SalesMetricsResponse> getTodaySalesMetrics(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/sales/today for store: {}", storeId);
        SalesMetricsResponse metrics = analyticsService.getTodaySalesMetrics(storeId);
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get average order value for today
     * GET /api/analytics/avgOrderValue/today
     */
    @GetMapping("/avgOrderValue/today")
    public ResponseEntity<AverageOrderValueResponse> getAverageOrderValue(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/avgOrderValue/today for store: {}", storeId);
        AverageOrderValueResponse aov = analyticsService.getAverageOrderValue(storeId);
        return ResponseEntity.ok(aov);
    }

    /**
     * Get driver status for a store
     * GET /api/analytics/drivers/status
     */
    @GetMapping("/drivers/status")
    public ResponseEntity<DriverStatusResponse> getDriverStatus(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/drivers/status for store: {}", storeId);
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
     * GET /api/analytics/sales/trends/{period}
     * @param period "WEEKLY" or "MONTHLY"
     */
    @GetMapping("/sales/trends/{period}")
    public ResponseEntity<SalesTrendResponse> getSalesTrends(
            @PathVariable String period,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/sales/trends/{} for store {}", period, storeId);
        SalesTrendResponse trends = analyticsService.getSalesTrends(storeId, period);
        return ResponseEntity.ok(trends);
    }

    /**
     * Get order type breakdown
     * GET /api/analytics/sales/breakdown/order-type
     */
    @GetMapping("/sales/breakdown/order-type")
    public ResponseEntity<OrderTypeBreakdownResponse> getOrderTypeBreakdown(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/sales/breakdown/order-type for store {}", storeId);
        OrderTypeBreakdownResponse breakdown = analyticsService.getOrderTypeBreakdown(storeId);
        return ResponseEntity.ok(breakdown);
    }

    /**
     * Get peak hours analysis
     * GET /api/analytics/sales/peak-hours
     */
    @GetMapping("/sales/peak-hours")
    public ResponseEntity<PeakHoursResponse> getPeakHours(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/sales/peak-hours for store {}", storeId);
        PeakHoursResponse peakHours = analyticsService.getPeakHours(storeId);
        return ResponseEntity.ok(peakHours);
    }

    /**
     * Get staff leaderboard
     * GET /api/analytics/staff/leaderboard?period={period}
     * @param period "TODAY", "WEEK", or "MONTH"
     */
    @GetMapping("/staff/leaderboard")
    public ResponseEntity<StaffLeaderboardResponse> getStaffLeaderboard(
            HttpServletRequest request,
            @RequestParam(name = "period", defaultValue = "TODAY") String period) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/analytics/staff/leaderboard for store {}, period {}", storeId, period);
        StaffLeaderboardResponse leaderboard = analyticsService.getStaffLeaderboard(storeId, period);
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * Get top selling products
     * GET /api/analytics/products/top-selling?period={period}&sortBy={sortBy}
     * @param period "TODAY", "WEEK", or "MONTH"
     * @param sortBy "QUANTITY" or "REVENUE"
     */
    @GetMapping("/products/top-selling")
    public ResponseEntity<TopProductsResponse> getTopProducts(
            HttpServletRequest request,
            @RequestParam(name = "period", defaultValue = "TODAY") String period,
            @RequestParam(name = "sortBy", defaultValue = "QUANTITY") String sortBy) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
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
