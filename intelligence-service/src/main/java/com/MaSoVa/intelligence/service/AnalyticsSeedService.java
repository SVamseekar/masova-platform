package com.MaSoVa.intelligence.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dev/demo seed for intelligence-service.
 * <p>
 * Intelligence has no owned Mongo entities — it aggregates commerce/order data via Feign
 * and caches results in Redis. This seeder clears caches and warms key analytics/BI
 * endpoints so manager dashboards are ready after platform reseed (Europe/Berlin zone).
 */
@Service
public class AnalyticsSeedService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsSeedService.class);

    private static final List<String> CACHE_NAMES = Arrays.asList(
            "salesMetrics", "staffLeaderboard", "staffPerformance", "driverStatus",
            "salesTrends", "orderTypeBreakdown", "peakHours", "topProducts",
            "salesForecast", "customerBehavior", "churnPrediction", "demandForecast",
            "costAnalysis", "executiveSummary", "benchmarking");

    private final AnalyticsService analyticsService;
    private final BIEngineService biEngineService;
    private final CostAnalysisService costAnalysisService;
    private final ExecutiveReportingService executiveReportingService;
    private final BenchmarkingService benchmarkingService;
    private final CacheManager cacheManager;
    private final Environment environment;

    public AnalyticsSeedService(AnalyticsService analyticsService,
                                BIEngineService biEngineService,
                                CostAnalysisService costAnalysisService,
                                ExecutiveReportingService executiveReportingService,
                                BenchmarkingService benchmarkingService,
                                CacheManager cacheManager,
                                Environment environment) {
        this.analyticsService = analyticsService;
        this.biEngineService = biEngineService;
        this.costAnalysisService = costAnalysisService;
        this.executiveReportingService = executiveReportingService;
        this.benchmarkingService = benchmarkingService;
        this.cacheManager = cacheManager;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Clear analytics Redis caches and warm primary dashboard queries for {@code storeId}.
     * Idempotent: safe to re-run; never writes fake analytics rows (read-through from orders).
     */
    public Map<String, Object> seedDemo(String storeId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Analytics seed is only available under dev/demo profiles");
        }
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }

        Map<String, Object> warmed = new LinkedHashMap<>();
        Map<String, String> errors = new LinkedHashMap<>();

        // 1) Clear stale Redis (may hold untyped LinkedHashMap from pre-Phase-D configs)
        CACHE_NAMES.forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        });
        warmed.put("cachesCleared", CACHE_NAMES.size());

        // 2) Warm analytics (Europe/Berlin "today" calendar)
        warm("sales", () -> analyticsService.getTodaySalesMetrics(storeId), warmed, errors);
        warm("aov", () -> analyticsService.getAverageOrderValue(storeId), warmed, errors);
        warm("staff-leaderboard", () -> analyticsService.getStaffLeaderboard(storeId, "TODAY"), warmed, errors);
        warm("sales-trends", () -> analyticsService.getSalesTrends(storeId, "WEEKLY"), warmed, errors);
        warm("order-breakdown", () -> analyticsService.getOrderTypeBreakdown(storeId), warmed, errors);
        warm("peak-hours", () -> analyticsService.getPeakHours(storeId), warmed, errors);
        warm("top-products", () -> analyticsService.getTopProducts(storeId, "TODAY", "REVENUE"), warmed, errors);
        warm("drivers", () -> analyticsService.getDriverStatus(storeId), warmed, errors);

        // 3) Warm BI / reports
        warm("sales-forecast", () -> biEngineService.generateSalesForecast(storeId, "WEEKLY", 7), warmed, errors);
        warm("cost-analysis", () -> costAnalysisService.analyzeCosts(storeId, "WEEK"), warmed, errors);
        warm("executive-summary", () -> executiveReportingService.generateExecutiveSummary("MONTH"), warmed, errors);
        warm("benchmarking", () -> benchmarkingService.generateBenchmarkingReport("MONTH"), warmed, errors);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("storeId", storeId);
        result.put("timezone", "Europe/Berlin");
        result.put("currency", "EUR");
        result.put("countryCode", "DE");
        result.put("warmed", warmed);
        if (!errors.isEmpty()) {
            result.put("errors", errors);
        }
        result.put("message", "Intelligence caches cleared and dashboard queries warmed (read-through from commerce)");
        log.info("Analytics seed-demo storeId={} warmed={} errors={}",
                storeId, warmed.size() - 1, errors.size());
        return result;
    }

    private void warm(String key, Runnable call, Map<String, Object> warmed, Map<String, String> errors) {
        try {
            call.run();
            warmed.put(key, "ok");
        } catch (Exception e) {
            errors.put(key, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            warmed.put(key, "error");
            log.warn("Analytics warm failed for {}: {}", key, e.getMessage());
        }
    }
}
