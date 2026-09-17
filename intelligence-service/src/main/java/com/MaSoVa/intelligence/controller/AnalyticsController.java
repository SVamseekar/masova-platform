package com.MaSoVa.intelligence.controller;

import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.*;
import com.MaSoVa.shared.util.StoreContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Analytics — 6 canonical endpoints at /api/analytics.
 * BI — 5 canonical endpoints at /api/bi.
 * Replaces: /sales/today, /avgOrderValue/today, /drivers/status,
 *           /staff/{id}/performance/today, /sales/trends/{period},
 *           /sales/breakdown/order-type, /sales/peak-hours,
 *           /staff/leaderboard, /products/top-selling, /cache/clear
 */
@RestController
@Tag(name = "Analytics", description = "Store analytics, BI forecasts and reporting (MANAGER/ASSISTANT_MANAGER only)")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;
    private final BIEngineService biEngineService;
    private final CostAnalysisService costAnalysisService;
    private final BenchmarkingService benchmarkingService;
    private final ExecutiveReportingService executiveReportingService;
    private final AnalyticsSeedService analyticsSeedService;
    private final CacheManager cacheManager;

    /** All @Cacheable value names used by analytics / BI services (must stay in sync). */
    private static final List<String> CACHE_NAMES = Arrays.asList(
            "salesMetrics", "staffLeaderboard", "staffPerformance", "driverStatus",
            "salesTrends", "orderTypeBreakdown", "peakHours", "topProducts",
            "salesForecast", "customerBehavior", "churnPrediction", "demandForecast",
            "costAnalysis", "executiveSummary", "benchmarking");

    public AnalyticsController(AnalyticsService analyticsService,
                               BIEngineService biEngineService,
                               CostAnalysisService costAnalysisService,
                               BenchmarkingService benchmarkingService,
                               ExecutiveReportingService executiveReportingService,
                               AnalyticsSeedService analyticsSeedService,
                               CacheManager cacheManager) {
        this.analyticsService = analyticsService;
        this.biEngineService = biEngineService;
        this.costAnalysisService = costAnalysisService;
        this.benchmarkingService = benchmarkingService;
        this.executiveReportingService = executiveReportingService;
        this.analyticsSeedService = analyticsSeedService;
        this.cacheManager = cacheManager;
    }

    // ── /api/analytics ────────────────────────────────────────────────────────

    /**
     * GET /api/analytics?type=sales|aov|drivers|sales-trends|order-breakdown|peak-hours|staff-leaderboard|top-products
     *                   &period=TODAY|WEEK|MONTH|WEEKLY|MONTHLY
     *                   &sortBy=QUANTITY|REVENUE
     *                   &staffId=
     * Replaces: /sales/today, /avgOrderValue/today, /drivers/status,
     *           /sales/trends/{period}, /sales/breakdown/order-type,
     *           /sales/peak-hours, /staff/leaderboard, /products/top-selling
     */
    @GetMapping("/api/analytics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Store analytics (type: sales|aov|drivers|sales-trends|order-breakdown|peak-hours|staff-leaderboard|top-products)")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "TODAY") String period,
            @RequestParam(required = false, defaultValue = "QUANTITY") String sortBy,
            @RequestParam(required = false) String staffId,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        return switch (type != null ? type : "") {
            case "sales" -> ResponseEntity.ok(analyticsService.getTodaySalesMetrics(storeId));
            case "aov" -> ResponseEntity.ok(analyticsService.getAverageOrderValue(storeId));
            case "drivers" -> ResponseEntity.ok(analyticsService.getDriverStatus(storeId));
            case "sales-trends" -> ResponseEntity.ok(analyticsService.getSalesTrends(storeId, period));
            case "order-breakdown" -> ResponseEntity.ok(analyticsService.getOrderTypeBreakdown(storeId));
            case "peak-hours" -> ResponseEntity.ok(analyticsService.getPeakHours(storeId));
            case "staff-leaderboard" -> ResponseEntity.ok(analyticsService.getStaffLeaderboard(storeId, period));
            case "top-products" -> ResponseEntity.ok(analyticsService.getTopProducts(storeId, period, sortBy));
            case "staff-performance" -> {
                if (staffId == null) yield ResponseEntity.badRequest().body(Map.of("error", "staffId required"));
                yield ResponseEntity.ok(analyticsService.getStaffPerformance(staffId));
            }
            default -> ResponseEntity.badRequest().body(Map.of("error",
                    "type required: sales|aov|drivers|sales-trends|order-breakdown|peak-hours|staff-leaderboard|top-products|staff-performance"));
        };
    }

    /**
     * POST /api/analytics/cache/clear — manual cache invalidation
     */
    @PostMapping("/api/analytics/cache/clear")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Clear all analytics caches for current store")
    public ResponseEntity<Map<String, String>> clearCaches(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        CACHE_NAMES.forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        });
        log.info("Analytics caches cleared for store: {}", storeId);
        return ResponseEntity.ok(Map.of("status", "success", "storeId", storeId));
    }

    /**
     * POST /api/analytics/seed-demo — clear caches + warm dashboard queries (dev/demo only).
     * Intelligence has no own entities; this read-through warms Redis from commerce data.
     */
    @PostMapping({"/api/analytics/seed-demo", "/api/analytics/test-data/seed-demo"})
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Seed/warm analytics caches for demo (dev/demo profile only)")
    public ResponseEntity<?> seedDemo(
            @RequestParam(defaultValue = "DOM001") String storeId,
            HttpServletRequest request) {
        if (!analyticsSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        String headerStore = StoreContextUtil.getStoreIdFromHeaders(request);
        String effective = (storeId != null && !storeId.isBlank()) ? storeId
                : (headerStore != null ? headerStore : "DOM001");
        try {
            return ResponseEntity.ok(analyticsSeedService.seedDemo(effective));
        } catch (Exception e) {
            log.error("Analytics seed-demo failed for store {}", effective, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Seed failed",
                            "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }

    // ── /api/bi ───────────────────────────────────────────────────────────────

    /**
     * GET /api/bi?type=sales-forecast|demand-forecast|customer-behavior|churn|cost-analysis
     *           &period=DAILY|WEEKLY|MONTHLY|TODAY|WEEK|MONTH|QUARTER|YEAR
     *           &days=7
     * Replaces: /forecast/sales, /forecast/demand, /analysis/customer-behavior,
     *           /prediction/churn, /cost-analysis
     */
    @GetMapping("/api/bi")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "BI engine (type: sales-forecast|demand-forecast|customer-behavior|churn|cost-analysis)")
    public ResponseEntity<?> getBI(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "WEEKLY") String period,
            @RequestParam(required = false, defaultValue = "7") int days,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        return switch (type != null ? type : "") {
            case "sales-forecast" -> ResponseEntity.ok(biEngineService.generateSalesForecast(storeId, period, days));
            case "demand-forecast" -> ResponseEntity.ok(biEngineService.generateDemandForecast(storeId, period));
            case "customer-behavior" -> ResponseEntity.ok(biEngineService.analyzeCustomerBehavior(storeId));
            case "churn" -> ResponseEntity.ok(biEngineService.predictChurn(storeId));
            case "cost-analysis" -> ResponseEntity.ok(costAnalysisService.analyzeCosts(storeId, period));
            default -> ResponseEntity.badRequest().body(Map.of("error",
                    "type required: sales-forecast|demand-forecast|customer-behavior|churn|cost-analysis"));
        };
    }

    /**
     * GET /api/bi/reports?type=benchmarking|executive-summary&period=WEEK|MONTH|QUARTER|YEAR
     * Replaces: /benchmarking/stores, /executive-summary
     */
    @GetMapping("/api/bi/reports")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "BI reports (type: benchmarking|executive-summary; period: WEEK|MONTH|QUARTER|YEAR)")
    public ResponseEntity<?> getReports(
            @RequestParam String type,
            @RequestParam(required = false, defaultValue = "MONTH") String period) {
        return switch (type) {
            case "benchmarking" -> ResponseEntity.ok(benchmarkingService.generateBenchmarkingReport(period));
            case "executive-summary" -> ResponseEntity.ok(executiveReportingService.generateExecutiveSummary(period));
            default -> ResponseEntity.badRequest().body(Map.of("error", "type required: benchmarking|executive-summary"));
        };
    }
}
