package com.MaSoVa.analytics.controller;

import com.MaSoVa.analytics.dto.*;
import com.MaSoVa.analytics.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API endpoints for Business Intelligence and Advanced Analytics
 * Phase 11 Implementation
 */
@RestController
@RequestMapping("/api/bi")
@RequiredArgsConstructor
@Slf4j
public class BIController {

    private final BIEngineService biEngineService;
    private final CostAnalysisService costAnalysisService;
    private final BenchmarkingService benchmarkingService;
    private final ExecutiveReportingService executiveReportingService;

    /**
     * Generate sales forecast
     * GET /api/bi/forecast/sales?storeId={storeId}&period={period}&days={days}
     * @param period "DAILY", "WEEKLY", or "MONTHLY"
     * @param days Number of days to forecast (default: 7)
     */
    @GetMapping("/forecast/sales")
    public ResponseEntity<SalesForecastResponse> getSalesForecast(
            @RequestParam(defaultValue = "store-001") String storeId,
            @RequestParam(defaultValue = "WEEKLY") String period,
            @RequestParam(defaultValue = "7") int days) {
        log.info("GET /api/bi/forecast/sales - storeId: {}, period: {}, days: {}", storeId, period, days);
        SalesForecastResponse forecast = biEngineService.generateSalesForecast(storeId, period, days);
        return ResponseEntity.ok(forecast);
    }

    /**
     * Analyze customer behavior patterns
     * GET /api/bi/analysis/customer-behavior?storeId={storeId}
     */
    @GetMapping("/analysis/customer-behavior")
    public ResponseEntity<CustomerBehaviorResponse> getCustomerBehaviorAnalysis(
            @RequestParam(defaultValue = "store-001") String storeId) {
        log.info("GET /api/bi/analysis/customer-behavior - storeId: {}", storeId);
        CustomerBehaviorResponse analysis = biEngineService.analyzeCustomerBehavior(storeId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * Predict customer churn
     * GET /api/bi/prediction/churn?storeId={storeId}
     */
    @GetMapping("/prediction/churn")
    public ResponseEntity<ChurnPredictionResponse> getChurnPrediction(
            @RequestParam(defaultValue = "store-001") String storeId) {
        log.info("GET /api/bi/prediction/churn - storeId: {}", storeId);
        ChurnPredictionResponse prediction = biEngineService.predictChurn(storeId);
        return ResponseEntity.ok(prediction);
    }

    /**
     * Generate demand forecast
     * GET /api/bi/forecast/demand?storeId={storeId}&period={period}
     * @param period "WEEKLY" or "MONTHLY"
     */
    @GetMapping("/forecast/demand")
    public ResponseEntity<DemandForecastResponse> getDemandForecast(
            @RequestParam(defaultValue = "store-001") String storeId,
            @RequestParam(defaultValue = "WEEKLY") String period) {
        log.info("GET /api/bi/forecast/demand - storeId: {}, period: {}", storeId, period);
        DemandForecastResponse forecast = biEngineService.generateDemandForecast(storeId, period);
        return ResponseEntity.ok(forecast);
    }

    /**
     * Get comprehensive cost analysis
     * GET /api/bi/cost-analysis?storeId={storeId}&period={period}
     * @param period "TODAY", "WEEK", or "MONTH"
     */
    @GetMapping("/cost-analysis")
    public ResponseEntity<CostAnalysisResponse> getCostAnalysis(
            @RequestParam(defaultValue = "store-001") String storeId,
            @RequestParam(defaultValue = "MONTH") String period) {
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
            @RequestParam(defaultValue = "MONTH") String period) {
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
            @RequestParam(defaultValue = "MONTH") String period) {
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
