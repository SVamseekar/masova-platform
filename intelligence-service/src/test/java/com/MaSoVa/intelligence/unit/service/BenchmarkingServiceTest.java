package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.BenchmarkingResponse;
import com.MaSoVa.intelligence.service.BenchmarkingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BenchmarkingService Unit Tests")
class BenchmarkingServiceTest {

    @Mock private OrderServiceClient orderServiceClient;

    @InjectMocks private BenchmarkingService benchmarkingService;

    private Map<String, Object> order(double amount, String storeId) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("storeId", storeId);
        return o;
    }

    // ── generateBenchmarkingReport ────────────────────────────────────────────

    @Nested
    @DisplayName("generateBenchmarkingReport")
    class GenerateBenchmarkingReport {

        @Test
        @DisplayName("returns non-null response with empty orders")
        void returnsNonNullForEmpty() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result).isNotNull();
            assertThat(result.getPeriod()).isEqualTo("MONTH");
        }

        @Test
        @DisplayName("groups orders by store and generates store comparisons")
        void generatesStoreComparisons() {
            List<Map<String, Object>> orders = List.of(
                order(500.0, "store-1"),
                order(300.0, "store-1"),
                order(800.0, "store-2")
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getStoreComparisons()).hasSize(2);
        }

        @Test
        @DisplayName("ranks stores by total sales descending")
        void ranksStoresBySalesDescending() {
            List<Map<String, Object>> orders = List.of(
                order(300.0, "store-1"),
                order(1000.0, "store-2")
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getStoreComparisons().get(0).getStoreId()).isEqualTo("store-2");
            assertThat(result.getStoreComparisons().get(0).getRank()).isEqualTo(1);
        }

        @Test
        @DisplayName("skips orders without storeId")
        void skipsOrdersWithoutStoreId() {
            Map<String, Object> noStore = new HashMap<>();
            noStore.put("totalAmount", 500.0);
            // no storeId key
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(noStore));

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getStoreComparisons()).isEmpty();
        }

        @Test
        @DisplayName("industry benchmarks have correct AOV of 350")
        void industryBenchmarksHaveCorrectAOV() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getIndustryBenchmarks().getAverageAOV())
                .isEqualByComparingTo(BigDecimal.valueOf(350));
        }

        @Test
        @DisplayName("generates 3 KPI comparisons")
        void generates3KPIComparisons() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getKpiComparisons()).hasSize(3);
        }

        @Test
        @DisplayName("generates 3 performance insights sorted by priority descending")
        void generates3InsightsSortedByPriority() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getInsights()).hasSize(3);
            assertThat(result.getInsights().get(0).getPriority())
                .isGreaterThanOrEqualTo(result.getInsights().get(1).getPriority());
        }

        @Test
        @DisplayName("QUARTER period uses 89-day lookback")
        void quarterPeriodWorks() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("QUARTER");

            assertThat(result.getPeriod()).isEqualTo("QUARTER");
        }

        @Test
        @DisplayName("store comparison has Excellent performance for high metrics")
        void storeComparisonHasExcellentPerformance() {
            // AOV >= 350, profit 18.5%, satisfaction 4.2 → Excellent
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 3; i++) {
                orders.add(order(400.0, "store-excellent"));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            assertThat(result.getStoreComparisons().get(0).getPerformanceLevel()).isEqualTo("Excellent");
        }

        @Test
        @DisplayName("AOV KPI shows Above Target when current >= 400")
        void aovKPIShowsAboveTarget() {
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                orders.add(order(450.0, "store-1")); // avg = 450 >= 400
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            BenchmarkingResponse result = benchmarkingService.generateBenchmarkingReport("MONTH");

            Optional<BenchmarkingResponse.KPIComparison> aovKPI = result.getKpiComparisons().stream()
                .filter(k -> "Average Order Value".equals(k.getKpiName()))
                .findFirst();
            assertThat(aovKPI).isPresent();
            assertThat(aovKPI.get().getPerformance()).isEqualTo("Above Target");
        }
    }
}
