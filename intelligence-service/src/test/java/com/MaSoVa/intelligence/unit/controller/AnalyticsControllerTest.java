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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
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
        @DisplayName("returns 400 for unknown type parameter")
        void returns400ForUnknownType() throws Exception {
            mockMvc.perform(get("/api/analytics")
                    .param("type", "invalid-type"))
                .andExpect(status().isBadRequest());
        }
    }

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
        @DisplayName("returns 400 for unknown type")
        void returns400ForUnknownType() throws Exception {
            mockMvc.perform(get("/api/bi")
                    .param("type", "unknown"))
                .andExpect(status().isBadRequest());
        }
    }

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
    }

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
                .andExpect(status().isOk());
        }
    }
}
