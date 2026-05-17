package com.MaSoVa.intelligence.unit.controller;

import com.MaSoVa.intelligence.controller.AnalyticsController;
import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.*;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsController Unit Tests")
class AnalyticsControllerTest extends BaseServiceTest {

    @Mock private AnalyticsService analyticsService;
    @Mock private BIEngineService biEngineService;
    @Mock private CostAnalysisService costAnalysisService;
    @Mock private BenchmarkingService benchmarkingService;
    @Mock private ExecutiveReportingService executiveReportingService;
    @Mock private CacheManager cacheManager;

    @InjectMocks private AnalyticsController analyticsController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    // ── GET /api/analytics ────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/analytics")
    class Analytics {

        @Test
        @DisplayName("returns 200 with sales data for type=sales")
        void returns200ForSalesType() throws Exception {
            when(analyticsService.getTodaySalesMetrics(any())).thenReturn(new SalesMetricsResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "sales")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 with AOV data for type=aov")
        void returns200ForAovType() throws Exception {
            when(analyticsService.getAverageOrderValue(any())).thenReturn(new AverageOrderValueResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "aov")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=drivers")
        void returns200ForDriversType() throws Exception {
            when(analyticsService.getDriverStatus(any())).thenReturn(new DriverStatusResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "drivers")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=sales-trends")
        void returns200ForSalesTrendsType() throws Exception {
            when(analyticsService.getSalesTrends(any(), anyString())).thenReturn(new SalesTrendResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "sales-trends")
                    .param("period", "WEEKLY")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=order-breakdown")
        void returns200ForOrderBreakdownType() throws Exception {
            when(analyticsService.getOrderTypeBreakdown(any())).thenReturn(new OrderTypeBreakdownResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "order-breakdown")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=peak-hours")
        void returns200ForPeakHoursType() throws Exception {
            when(analyticsService.getPeakHours(any())).thenReturn(new PeakHoursResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "peak-hours")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=staff-leaderboard")
        void returns200ForStaffLeaderboardType() throws Exception {
            when(analyticsService.getStaffLeaderboard(any(), anyString())).thenReturn(new StaffLeaderboardResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "staff-leaderboard")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=top-products")
        void returns200ForTopProductsType() throws Exception {
            when(analyticsService.getTopProducts(any(), anyString(), anyString())).thenReturn(new TopProductsResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "top-products")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=staff-performance with staffId")
        void returns200ForStaffPerformanceWithStaffId() throws Exception {
            when(analyticsService.getStaffPerformance(anyString())).thenReturn(new StaffPerformanceResponse());

            mockMvc.perform(get("/api/analytics")
                    .param("type", "staff-performance")
                    .param("staffId", "staff-123")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for type=staff-performance without staffId")
        void returns400ForStaffPerformanceMissingStaffId() throws Exception {
            mockMvc.perform(get("/api/analytics")
                    .param("type", "staff-performance")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("staffId required"));
        }

        @Test
        @DisplayName("returns 400 for unknown type parameter")
        void returns400ForUnknownType() throws Exception {
            mockMvc.perform(get("/api/analytics")
                    .param("type", "invalid-type"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when no type parameter provided")
        void returns400ForMissingType() throws Exception {
            mockMvc.perform(get("/api/analytics"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns error message in body for unknown type")
        void returnsErrorMessageForUnknownType() throws Exception {
            mockMvc.perform(get("/api/analytics")
                    .param("type", "bogus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
        }
    }

    // ── POST /api/analytics/cache/clear ──────────────────────────────────────

    @Nested
    @DisplayName("POST /api/analytics/cache/clear")
    class ClearCache {

        @Test
        @DisplayName("returns 200 on cache clear")
        void returns200() throws Exception {
            Cache mockCache = mock(Cache.class);
            doNothing().when(mockCache).clear();
            when(cacheManager.getCache(anyString())).thenReturn(mockCache);

            mockMvc.perform(post("/api/analytics/cache/clear")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
        }

        @Test
        @DisplayName("returns storeId in response body")
        void returnsStoreIdInBody() throws Exception {
            Cache mockCache = mock(Cache.class);
            when(cacheManager.getCache(anyString())).thenReturn(mockCache);

            mockMvc.perform(post("/api/analytics/cache/clear")
                    .header("X-User-Store-Id", "store-abc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeId").value("store-abc"));
        }

        @Test
        @DisplayName("handles null cache gracefully — does not throw when cache is null")
        void handlesNullCacheGracefully() throws Exception {
            when(cacheManager.getCache(anyString())).thenReturn(null);

            mockMvc.perform(post("/api/analytics/cache/clear")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }
    }

    // ── GET /api/bi ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/bi")
    class BI {

        @Test
        @DisplayName("returns 200 with sales forecast for type=sales-forecast")
        void returns200ForSalesForecast() throws Exception {
            when(biEngineService.generateSalesForecast(any(), anyString(), anyInt()))
                .thenReturn(new SalesForecastResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "sales-forecast")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=demand-forecast")
        void returns200ForDemandForecast() throws Exception {
            when(biEngineService.generateDemandForecast(any(), anyString()))
                .thenReturn(new DemandForecastResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "demand-forecast")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=customer-behavior")
        void returns200ForCustomerBehavior() throws Exception {
            when(biEngineService.analyzeCustomerBehavior(any()))
                .thenReturn(new CustomerBehaviorResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "customer-behavior")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=churn")
        void returns200ForChurn() throws Exception {
            when(biEngineService.predictChurn(any()))
                .thenReturn(new ChurnPredictionResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "churn")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=cost-analysis")
        void returns200ForCostAnalysis() throws Exception {
            when(costAnalysisService.analyzeCosts(any(), anyString()))
                .thenReturn(new CostAnalysisResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "cost-analysis")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for unknown type")
        void returns400ForUnknownType() throws Exception {
            mockMvc.perform(get("/api/bi")
                    .param("type", "unknown"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when no type provided")
        void returns400ForMissingType() throws Exception {
            mockMvc.perform(get("/api/bi"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("uses default days=7 when not specified")
        void usesDefaultDays() throws Exception {
            when(biEngineService.generateSalesForecast(any(), anyString(), eq(7)))
                .thenReturn(new SalesForecastResponse());

            mockMvc.perform(get("/api/bi")
                    .param("type", "sales-forecast")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());

            verify(biEngineService).generateSalesForecast(any(), eq("WEEKLY"), eq(7));
        }
    }

    // ── GET /api/bi/reports ───────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/bi/reports")
    class BIReports {

        @Test
        @DisplayName("returns 200 for type=executive-summary")
        void returns200ForExecutiveSummary() throws Exception {
            when(executiveReportingService.generateExecutiveSummary(anyString()))
                .thenReturn(new ExecutiveSummaryResponse());

            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "executive-summary")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for type=benchmarking")
        void returns200ForBenchmarking() throws Exception {
            when(benchmarkingService.generateBenchmarkingReport(anyString()))
                .thenReturn(new BenchmarkingResponse());

            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "benchmarking")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for unknown report type")
        void returns400ForUnknownReportType() throws Exception {
            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "unknown-report"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
        }

        @Test
        @DisplayName("uses default period=MONTH when not specified")
        void usesDefaultPeriod() throws Exception {
            when(executiveReportingService.generateExecutiveSummary(eq("MONTH")))
                .thenReturn(new ExecutiveSummaryResponse());

            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "executive-summary")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());

            verify(executiveReportingService).generateExecutiveSummary("MONTH");
        }

        @Test
        @DisplayName("passes period to benchmarking service")
        void passesPeriodToBenchmarkingService() throws Exception {
            when(benchmarkingService.generateBenchmarkingReport("QUARTER"))
                .thenReturn(new BenchmarkingResponse());

            mockMvc.perform(get("/api/bi/reports")
                    .param("type", "benchmarking")
                    .param("period", "QUARTER"))
                .andExpect(status().isOk());

            verify(benchmarkingService).generateBenchmarkingReport("QUARTER");
        }
    }
}
