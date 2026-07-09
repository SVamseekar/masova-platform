package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.dto.SalesMetricsResponse;
import com.MaSoVa.intelligence.dto.StaffLeaderboardResponse;
import com.MaSoVa.intelligence.service.AnalyticsSeedService;
import com.MaSoVa.intelligence.service.AnalyticsService;
import com.MaSoVa.intelligence.service.BIEngineService;
import com.MaSoVa.intelligence.service.BenchmarkingService;
import com.MaSoVa.intelligence.service.CostAnalysisService;
import com.MaSoVa.intelligence.service.ExecutiveReportingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("AnalyticsSeedService (Phase E — intelligence)")
class AnalyticsSeedServiceTest {

    @Mock AnalyticsService analyticsService;
    @Mock BIEngineService biEngineService;
    @Mock CostAnalysisService costAnalysisService;
    @Mock ExecutiveReportingService executiveReportingService;
    @Mock BenchmarkingService benchmarkingService;
    @Mock CacheManager cacheManager;
    @Mock Environment environment;

    AnalyticsSeedService service;

    @BeforeEach
    void setUp() {
        service = new AnalyticsSeedService(
                analyticsService, biEngineService, costAnalysisService,
                executiveReportingService, benchmarkingService, cacheManager, environment);
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(true);
        Cache cache = mock(Cache.class);
        when(cacheManager.getCache(anyString())).thenReturn(cache);
        when(analyticsService.getTodaySalesMetrics(anyString())).thenReturn(new SalesMetricsResponse());
        when(analyticsService.getAverageOrderValue(anyString())).thenReturn(null);
        when(analyticsService.getStaffLeaderboard(anyString(), anyString()))
                .thenReturn(new StaffLeaderboardResponse());
        when(analyticsService.getSalesTrends(anyString(), anyString())).thenReturn(null);
        when(analyticsService.getOrderTypeBreakdown(anyString())).thenReturn(null);
        when(analyticsService.getPeakHours(anyString())).thenReturn(null);
        when(analyticsService.getTopProducts(anyString(), anyString(), anyString())).thenReturn(null);
        when(analyticsService.getDriverStatus(anyString())).thenReturn(null);
        when(biEngineService.generateSalesForecast(anyString(), anyString(), anyInt())).thenReturn(null);
        when(costAnalysisService.analyzeCosts(anyString(), anyString())).thenReturn(null);
        when(executiveReportingService.generateExecutiveSummary(anyString())).thenReturn(null);
        when(benchmarkingService.generateBenchmarkingReport(anyString())).thenReturn(null);
    }

    @Test
    @DisplayName("blocked outside dev/demo")
    void blockedOutsideDev() {
        when(environment.acceptsProfiles(Profiles.of("dev", "demo"))).thenReturn(false);
        assertThatThrownBy(() -> service.seedDemo("DOM001"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("clears caches and warms analytics for EU store")
    void warmsDashboard() {
        Map<String, Object> result = service.seedDemo("DOM001");

        assertThat(result.get("storeId")).isEqualTo("DOM001");
        assertThat(result.get("timezone")).isEqualTo("Europe/Berlin");
        assertThat(result.get("currency")).isEqualTo("EUR");
        assertThat(result.get("countryCode")).isEqualTo("DE");
        verify(analyticsService, atLeastOnce()).getTodaySalesMetrics("DOM001");
        verify(analyticsService, atLeastOnce()).getStaffLeaderboard("DOM001", "TODAY");
        verify(cacheManager, atLeastOnce()).getCache(anyString());
    }
}
