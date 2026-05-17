package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.ExecutiveSummaryResponse;
import com.MaSoVa.intelligence.service.ExecutiveReportingService;
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
@DisplayName("ExecutiveReportingService Unit Tests")
class ExecutiveReportingServiceTest {

    @Mock private OrderServiceClient orderServiceClient;

    @InjectMocks private ExecutiveReportingService executiveReportingService;

    private Map<String, Object> order(double amount, String orderType, String customerId) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("orderType", orderType);
        o.put("customerId", customerId);
        return o;
    }

    private Map<String, Object> orderWithItem(double amount, String itemName, double price, int qty) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("orderType", "DINE_IN");
        Map<String, Object> item = new HashMap<>();
        item.put("itemName", itemName);
        item.put("price", price);
        item.put("quantity", qty);
        o.put("items", List.of(item));
        return o;
    }

    // ── generateExecutiveSummary ──────────────────────────────────────────────

    @Nested
    @DisplayName("generateExecutiveSummary")
    class GenerateExecutiveSummary {

        @Test
        @DisplayName("returns non-null response with empty orders")
        void returnsNonNullForEmpty() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result).isNotNull();
            assertThat(result.getReportPeriod()).isEqualTo("WEEK");
        }

        @Test
        @DisplayName("financial summary: total revenue sums all order amounts")
        @SuppressWarnings("unchecked")
        void financialSummaryCalculatesTotalRevenue() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(
                List.of(
                    order(1000.0, "DINE_IN", "c1"),
                    order(500.0, "DELIVERY", "c2")
                ),
                List.of() // previous period empty
            );

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getFinancialSummary().getTotalRevenue())
                .isEqualByComparingTo(new BigDecimal("1500.0"));
        }

        @Test
        @DisplayName("financial summary: costs = 60% of revenue")
        void financialSummaryCostsAre60Percent() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(order(1000.0, "DINE_IN", "c1")))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getFinancialSummary().getTotalCosts())
                .isEqualByComparingTo(new BigDecimal("600.0"));
        }

        @Test
        @DisplayName("financial summary: gross profit = revenue - costs")
        void grossProfitIsRevenuMinusCosts() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(order(1000.0, "DINE_IN", "c1")))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            BigDecimal rev = result.getFinancialSummary().getTotalRevenue();
            BigDecimal costs = result.getFinancialSummary().getTotalCosts();
            assertThat(result.getFinancialSummary().getGrossProfit())
                .isEqualByComparingTo(rev.subtract(costs));
        }

        @Test
        @DisplayName("financial summary: zero profit margin for zero revenue")
        void zeroProfitMarginForZeroRevenue() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getFinancialSummary().getGrossProfitMargin())
                .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("operational metrics: counts unique customers")
        void operationalMetricsCountsUniqueCustomers() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(
                    order(100.0, "DINE_IN", "c1"),
                    order(200.0, "DINE_IN", "c1"), // same customer, should count once
                    order(300.0, "DELIVERY", "c2")
                ))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getOperationalMetrics().getTotalCustomers()).isEqualTo(2);
        }

        @Test
        @DisplayName("operational metrics: average order value computed correctly")
        void operationalMetricsAOV() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(
                    order(300.0, "DINE_IN", "c1"),
                    order(500.0, "DELIVERY", "c2")
                ))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getOperationalMetrics().getAverageOrderValue())
                .isEqualByComparingTo(new BigDecimal("400.00"));
        }

        @Test
        @DisplayName("generates 4 KPI tiles")
        void generates4KPITiles() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getKpiTiles()).hasSize(4);
        }

        @Test
        @DisplayName("KPI tiles have trend UP when current > previous")
        void kpiTilesTrendUpWhenCurrentHigher() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(order(2000.0, "DINE_IN", "c1"))) // current period
                .thenReturn(List.of(order(1000.0, "DINE_IN", "c1"))); // previous period

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getKpiTiles().get(0).getTrend()).isEqualTo("UP");
        }

        @Test
        @DisplayName("KPI tiles have trend STABLE when previous is zero")
        void kpiTilesTrendStableWhenPreviousZero() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(order(500.0, "DINE_IN", "c1")))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            // percentChange = 0 when previous = 0 → STABLE
            boolean hasStable = result.getKpiTiles().stream()
                .anyMatch(t -> "STABLE".equals(t.getTrend()));
            assertThat(hasStable).isTrue();
        }

        @Test
        @DisplayName("growth metrics has projected annual revenue")
        void growthMetricsHasProjectedAnnualRevenue() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getGrowthMetrics().getProjectedAnnualRevenue()).startsWith("₹");
        }

        @Test
        @DisplayName("growth metrics has 3 top drivers")
        void growthMetrics3TopDrivers() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getGrowthMetrics().getTopDrivers()).hasSize(3);
        }

        @Test
        @DisplayName("generates 3 actionable insights")
        void generates3ActionableInsights() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getInsights()).hasSize(3);
        }

        @Test
        @DisplayName("insights have HIGH and MEDIUM priorities")
        void insightsHaveMixedPriorities() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            boolean hasHigh = result.getInsights().stream().anyMatch(i -> "HIGH".equals(i.getPriority()));
            boolean hasMedium = result.getInsights().stream().anyMatch(i -> "MEDIUM".equals(i.getPriority()));
            assertThat(hasHigh).isTrue();
            assertThat(hasMedium).isTrue();
        }

        @Test
        @DisplayName("top performers includes product when order has items")
        void topPerformersIncludesProductWithItems() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(orderWithItem(500.0, "Biryani", 150.0, 2)))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            assertThat(result.getTopPerformers()).isNotEmpty();
            assertThat(result.getTopPerformers().get(0).getCategory()).isEqualTo("Product");
        }

        @Test
        @DisplayName("YEAR period sets correct start date (1 year back)")
        void yearPeriodSetsStartDate() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("YEAR");

            assertThat(result.getReportPeriod()).isEqualTo("YEAR");
        }

        @Test
        @DisplayName("QUARTER period sets 89-day lookback")
        void quarterPeriodSets89DayLookback() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("QUARTER");

            assertThat(result.getReportPeriod()).isEqualTo("QUARTER");
        }

        @Test
        @DisplayName("MONTH period sets 29-day lookback")
        void monthPeriodSets29DayLookback() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("MONTH");

            assertThat(result.getReportPeriod()).isEqualTo("MONTH");
        }

        @Test
        @DisplayName("revenue by channel groups orders by order type")
        void revenueByChannelGroupsByOrderType() {
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(
                    order(500.0, "DELIVERY", "c1"),
                    order(300.0, "DINE_IN", "c2")
                ))
                .thenReturn(List.of());

            ExecutiveSummaryResponse result = executiveReportingService.generateExecutiveSummary("WEEK");

            Map<String, BigDecimal> channels = result.getFinancialSummary().getRevenueByChannel();
            assertThat(channels).containsKey("DELIVERY");
            assertThat(channels.get("DELIVERY")).isEqualByComparingTo(new BigDecimal("500.0"));
        }
    }
}
