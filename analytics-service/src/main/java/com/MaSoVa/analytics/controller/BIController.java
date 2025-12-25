package com.MaSoVa.analytics.controller;

import com.MaSoVa.analytics.dto.*;
import com.MaSoVa.analytics.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import jakarta.servlet.http.HttpServletRequest;

/**
 * REST API endpoints for Business Intelligence and Advanced Analytics
 * Phase 11 Implementation
 */
@RestController
@Tag(name = "BIController", description = "Business Intelligence and advanced analytics")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/bi")
public class BIController {

    private static final Logger log = LoggerFactory.getLogger(BIController.class);

    private final BIEngineService biEngineService;
    private final CostAnalysisService costAnalysisService;
    private final BenchmarkingService benchmarkingService;
    private final ExecutiveReportingService executiveReportingService;

    public BIController(BIEngineService biEngineService,
                        CostAnalysisService costAnalysisService,
                        BenchmarkingService benchmarkingService,
                        ExecutiveReportingService executiveReportingService) {
        this.biEngineService = biEngineService;
        this.costAnalysisService = costAnalysisService;
        this.benchmarkingService = benchmarkingService;
        this.executiveReportingService = executiveReportingService;
    }

    /**
     * Extract storeId from HTTP headers
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    /**
     * Generate sales forecast
     * GET /api/bi/forecast/sales?period={period}&days={days}
     * @param period "DAILY", "WEEKLY", or "MONTHLY"
     * @param days Number of days to forecast (default: 7)
     */
    @GetMapping("/forecast/sales")
    public ResponseEntity<SalesForecastResponse> getSalesForecast(
            HttpServletRequest request,
            @RequestParam(name = "period", defaultValue = "WEEKLY") String period,
            @RequestParam(name = "days", defaultValue = "7") int days) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("GET /api/bi/forecast/sales - storeId: {}, period: {}, days: {}", storeId, period, days);
        SalesForecastResponse forecast = biEngineService.generateSalesForecast(storeId, period, days);
        return ResponseEntity.ok(forecast);
    }

    /**
     * Analyze customer behavior patterns
     * GET /api/bi/analysis/customer-behavior
     */
    @GetMapping("/analysis/customer-behavior")
    public ResponseEntity<CustomerBehaviorResponse> getCustomerBehaviorAnalysis(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("GET /api/bi/analysis/customer-behavior - storeId: {}", storeId);
        CustomerBehaviorResponse analysis = biEngineService.analyzeCustomerBehavior(storeId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * Predict customer churn
     * GET /api/bi/prediction/churn
     */
    @GetMapping("/prediction/churn")
    public ResponseEntity<ChurnPredictionResponse> getChurnPrediction(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("GET /api/bi/prediction/churn - storeId: {}", storeId);
        ChurnPredictionResponse prediction = biEngineService.predictChurn(storeId);
        return ResponseEntity.ok(prediction);
    }

    /**
     * Generate demand forecast
     * GET /api/bi/forecast/demand?period={period}
     * @param period "WEEKLY" or "MONTHLY"
     */
    @GetMapping("/forecast/demand")
    public ResponseEntity<DemandForecastResponse> getDemandForecast(
            HttpServletRequest request,
            @RequestParam(name = "period", defaultValue = "WEEKLY") String period) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("GET /api/bi/forecast/demand - storeId: {}, period: {}", storeId, period);
        DemandForecastResponse forecast = biEngineService.generateDemandForecast(storeId, period);
        return ResponseEntity.ok(forecast);
    }

    /**
     * Get comprehensive cost analysis
     * GET /api/bi/cost-analysis?period={period}
     * @param period "TODAY", "WEEK", or "MONTH"
     */
    @GetMapping("/cost-analysis")
    public ResponseEntity<CostAnalysisResponse> getCostAnalysis(
            HttpServletRequest request,
            @RequestParam(name = "period", defaultValue = "MONTH") String period) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("GET /api/bi/cost-analysis - storeId: {}, period: {}", storeId, period);
        CostAnalysisResponse analysis = costAnalysisService.analyzeCosts(storeId, period);
        return ResponseEntity.ok(analysis);
    }

    /**
     * Get benchmarking report (multi-store comparison)
     * GET /api/bi/benchmarking/stores?period={period}
     * @param period "WEEK", "MONTH", or "QUARTER"
     */
    @GetMapping("/benchmarking/stores")
    public ResponseEntity<BenchmarkingResponse> getStoreBenchmarking(
            @RequestParam(name = "period", defaultValue = "MONTH") String period) {
        log.info("GET /api/bi/benchmarking/stores - period: {}", period);
        BenchmarkingResponse benchmarking = benchmarkingService.generateBenchmarkingReport(period);
        return ResponseEntity.ok(benchmarking);
    }

    /**
     * Get executive summary report
     * GET /api/bi/executive-summary?period={period}
     * @param period "WEEK", "MONTH", "QUARTER", or "YEAR"
     */
    @GetMapping("/executive-summary")
    public ResponseEntity<ExecutiveSummaryResponse> getExecutiveSummary(
            @RequestParam(name = "period", defaultValue = "MONTH") String period) {
        log.info("GET /api/bi/executive-summary - period: {}", period);
        ExecutiveSummaryResponse summary = executiveReportingService.generateExecutiveSummary(period);
        return ResponseEntity.ok(summary);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("BI Service is running - Phase 11 Advanced Analytics");
    }
}
