package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.client.UserServiceClient;
import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.AnalyticsService;
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
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AnalyticsService Unit Tests")
class AnalyticsServiceTest {

    @Mock private OrderServiceClient orderServiceClient;
    @Mock private UserServiceClient userServiceClient;

    @InjectMocks private AnalyticsService analyticsService;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> deliveryOrder(double total) {
        Map<String, Object> o = new HashMap<>();
        o.put("orderType", "DELIVERY");
        o.put("status", "DELIVERED");
        o.put("total", total);
        return o;
    }

    private Map<String, Object> takeawayOrder(double total) {
        Map<String, Object> o = new HashMap<>();
        o.put("orderType", "TAKEAWAY");
        o.put("status", "COMPLETED");
        o.put("total", total);
        return o;
    }

    private Map<String, Object> dineInOrder(double total) {
        Map<String, Object> o = new HashMap<>();
        o.put("orderType", "DINE_IN");
        o.put("status", "SERVED");
        o.put("total", total);
        return o;
    }

    private Map<String, Object> incompleteOrder(double total) {
        Map<String, Object> o = new HashMap<>();
        o.put("orderType", "DELIVERY");
        o.put("status", "PENDING");
        o.put("total", total);
        return o;
    }

    // ── getTodaySalesMetrics ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getTodaySalesMetrics")
    class GetTodaySalesMetrics {

        @Test
        @DisplayName("returns non-null response with empty orders")
        void returnsNonNullWithEmptyOrders() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result).isNotNull();
            assertThat(result.getTodaySales()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTodayOrderCount()).isZero();
        }

        @Test
        @DisplayName("sums only completed delivery orders in todaySales")
        void sumsOnlyCompletedOrders() {
            List<Map<String, Object>> todayOrders = List.of(
                deliveryOrder(300.0),
                deliveryOrder(200.0),
                incompleteOrder(500.0) // should NOT be counted
            );
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(todayOrders);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTodaySales()).isEqualByComparingTo(new BigDecimal("500.0"));
            assertThat(result.getTodayOrderCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("counts TAKEAWAY COMPLETED and DINE_IN SERVED as completed")
        void countsAllCompletedOrderTypes() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(100.0),
                takeawayOrder(200.0),
                dineInOrder(300.0)
            );
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTodaySales()).isEqualByComparingTo(new BigDecimal("600.0"));
            assertThat(result.getTodayOrderCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("calculates trend UP when today > yesterday by more than 5%")
        void calculatesTrendUp() {
            List<Map<String, Object>> todayOrders = List.of(deliveryOrder(1000.0));
            List<Map<String, Object>> yesterdayOrders = List.of(deliveryOrder(500.0));
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(todayOrders);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(yesterdayOrders);

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTrend()).isEqualTo("UP");
            assertThat(result.getPercentChangeFromYesterday()).isGreaterThan(BigDecimal.valueOf(5));
        }

        @Test
        @DisplayName("calculates trend DOWN when today < yesterday by more than 5%")
        void calculatesTrendDown() {
            List<Map<String, Object>> todayOrders = List.of(deliveryOrder(400.0));
            List<Map<String, Object>> yesterdayOrders = List.of(deliveryOrder(1000.0));
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(todayOrders);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(yesterdayOrders);

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTrend()).isEqualTo("DOWN");
        }

        @Test
        @DisplayName("calculates trend STABLE when percent change is within ±5%")
        void calculatesTrendStable() {
            List<Map<String, Object>> todayOrders = List.of(deliveryOrder(1020.0));
            List<Map<String, Object>> yesterdayOrders = List.of(deliveryOrder(1000.0));
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(todayOrders);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(yesterdayOrders);

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTrend()).isEqualTo("STABLE");
        }

        @Test
        @DisplayName("handles total field as String gracefully")
        void handlesTotalAsString() {
            Map<String, Object> order = new HashMap<>();
            order.put("orderType", "DELIVERY");
            order.put("status", "DELIVERED");
            order.put("total", "250.50");
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of(order));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTodaySales()).isEqualByComparingTo(new BigDecimal("250.50"));
        }

        @Test
        @DisplayName("returns ZERO percent change when yesterday had no sales")
        void returnsZeroPercentChangeWhenYesterdayEmpty() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of(deliveryOrder(500.0)));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getPercentChangeFromYesterday()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("falls back to totalAmount field when total is null")
        void fallsBackToTotalAmountField() {
            Map<String, Object> order = new HashMap<>();
            order.put("orderType", "DELIVERY");
            order.put("status", "DELIVERED");
            order.put("totalAmount", 150.0);
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of(order));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

            assertThat(result.getTodaySales()).isEqualByComparingTo(new BigDecimal("150.0"));
        }
    }

    // ── getAverageOrderValue ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getAverageOrderValue")
    class GetAverageOrderValue {

        @Test
        @DisplayName("returns zero AOV when no orders")
        void returnsZeroAovForNoOrders() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            AverageOrderValueResponse result = analyticsService.getAverageOrderValue("store-1");

            assertThat(result.getAverageOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTrend()).isEqualTo("STABLE");
        }

        @Test
        @DisplayName("calculates AOV correctly for multiple orders")
        void calculatesAovCorrectly() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(300.0),
                deliveryOrder(500.0),
                deliveryOrder(200.0)
            );
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            AverageOrderValueResponse result = analyticsService.getAverageOrderValue("store-1");

            assertThat(result.getAverageOrderValue()).isEqualByComparingTo(new BigDecimal("333.33"));
            assertThat(result.getTotalOrders()).isEqualTo(3);
            assertThat(result.getTotalSales()).isEqualByComparingTo(new BigDecimal("1000.0"));
        }

        @Test
        @DisplayName("returns non-null response")
        void returnsNonNull() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
            assertThat(analyticsService.getAverageOrderValue("store-1")).isNotNull();
        }
    }

    // ── getDriverStatus ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getDriverStatus")
    class GetDriverStatus {

        @Test
        @DisplayName("counts available and busy drivers correctly")
        void countsDriversByStatus() {
            List<Map<String, Object>> drivers = List.of(
                Map.of("id", "d1", "status", "AVAILABLE"),
                Map.of("id", "d2", "status", "AVAILABLE"),
                Map.of("id", "d3", "status", "BUSY")
            );
            when(userServiceClient.getDriversByStore("store-1")).thenReturn(drivers);
            when(orderServiceClient.getActiveDeliveryCount()).thenReturn(3);
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            DriverStatusResponse result = analyticsService.getDriverStatus("store-1");

            assertThat(result.getTotalDrivers()).isEqualTo(3);
            assertThat(result.getAvailableDrivers()).isEqualTo(2);
            assertThat(result.getBusyDrivers()).isEqualTo(1);
            assertThat(result.getActiveDeliveries()).isEqualTo(3);
        }

        @Test
        @DisplayName("counts completed deliveries for today from orders")
        void countsCompletedDeliveries() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(100.0),
                deliveryOrder(200.0),
                takeawayOrder(300.0)  // not a delivery
            );
            when(userServiceClient.getDriversByStore(any())).thenReturn(List.of());
            when(orderServiceClient.getActiveDeliveryCount()).thenReturn(0);
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            DriverStatusResponse result = analyticsService.getDriverStatus("store-1");

            assertThat(result.getCompletedTodayDeliveries()).isEqualTo(2);
        }

        @Test
        @DisplayName("handles null activeDeliveryCount gracefully")
        void handlesNullActiveDeliveryCount() {
            when(userServiceClient.getDriversByStore(any())).thenReturn(List.of());
            when(orderServiceClient.getActiveDeliveryCount()).thenReturn(null);
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            DriverStatusResponse result = analyticsService.getDriverStatus("store-1");

            assertThat(result.getActiveDeliveries()).isZero();
        }
    }

    // ── getStaffPerformance ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getStaffPerformance")
    class GetStaffPerformance {

        @Test
        @DisplayName("calculates EXCELLENT for 50+ orders and 10000+ sales")
        void calculatesExcellentPerformance() {
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 50; i++) orders.add(deliveryOrder(250.0)); // 50 orders, 12500 total
            when(orderServiceClient.getOrdersByStaff(eq("staff-1"), any())).thenReturn(orders);
            when(userServiceClient.getStaffDetails("staff-1")).thenReturn(Map.of("name", "Alice"));

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-1");

            assertThat(result.getPerformanceLevel()).isEqualTo("EXCELLENT");
            assertThat(result.getStaffName()).isEqualTo("Alice");
            assertThat(result.getOrdersProcessedToday()).isEqualTo(50);
        }

        @Test
        @DisplayName("calculates GOOD for 30+ orders and 5000+ sales")
        void calculatesGoodPerformance() {
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 30; i++) orders.add(deliveryOrder(200.0)); // 30 orders, 6000 total
            when(orderServiceClient.getOrdersByStaff(eq("staff-2"), any())).thenReturn(orders);
            when(userServiceClient.getStaffDetails("staff-2")).thenReturn(Map.of("name", "Bob"));

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-2");

            assertThat(result.getPerformanceLevel()).isEqualTo("GOOD");
        }

        @Test
        @DisplayName("calculates AVERAGE for 15+ orders below GOOD threshold")
        void calculatesAveragePerformance() {
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 15; i++) orders.add(deliveryOrder(100.0));
            when(orderServiceClient.getOrdersByStaff(eq("staff-3"), any())).thenReturn(orders);
            when(userServiceClient.getStaffDetails("staff-3")).thenReturn(Map.of("name", "Charlie"));

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-3");

            assertThat(result.getPerformanceLevel()).isEqualTo("AVERAGE");
        }

        @Test
        @DisplayName("calculates NEEDS_IMPROVEMENT for fewer than 15 orders")
        void calculatesNeedsImprovement() {
            when(orderServiceClient.getOrdersByStaff(eq("staff-4"), any())).thenReturn(List.of(deliveryOrder(50.0)));
            when(userServiceClient.getStaffDetails("staff-4")).thenReturn(Map.of("name", "Dave"));

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-4");

            assertThat(result.getPerformanceLevel()).isEqualTo("NEEDS_IMPROVEMENT");
        }

        @Test
        @DisplayName("uses Unknown as name when staff details are null")
        void usesUnknownWhenStaffDetailsNull() {
            when(orderServiceClient.getOrdersByStaff(any(), any())).thenReturn(List.of());
            when(userServiceClient.getStaffDetails(any())).thenReturn(null);

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-x");

            assertThat(result.getStaffName()).isEqualTo("Unknown");
        }

        @Test
        @DisplayName("calculates zero AOV when no orders processed")
        void calculatesZeroAovForNoOrders() {
            when(orderServiceClient.getOrdersByStaff(any(), any())).thenReturn(List.of());
            when(userServiceClient.getStaffDetails(any())).thenReturn(Map.of("name", "Eve"));

            StaffPerformanceResponse result = analyticsService.getStaffPerformance("staff-5");

            assertThat(result.getAverageOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getOrdersProcessedToday()).isZero();
        }
    }

    // ── getSalesTrends ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getSalesTrends")
    class GetSalesTrends {

        @Test
        @DisplayName("returns 7 data points for WEEKLY period")
        void returns7DataPointsForWeekly() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "WEEKLY");

            assertThat(result.getDataPoints()).hasSize(7);
            assertThat(result.getPeriod()).isEqualTo("WEEKLY");
        }

        @Test
        @DisplayName("returns 30 data points for MONTHLY period")
        void returns30DataPointsForMonthly() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "MONTHLY");

            assertThat(result.getDataPoints()).hasSize(30);
            assertThat(result.getPeriod()).isEqualTo("MONTHLY");
        }

        @Test
        @DisplayName("aggregates sales for orders with LocalDateTime createdAt")
        void aggregatesSalesWithLocalDateTimeCreatedAt() {
            Map<String, Object> order = new HashMap<>();
            order.put("orderType", "DELIVERY");
            order.put("status", "DELIVERED");
            order.put("total", 500.0);
            order.put("createdAt", LocalDateTime.now());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(order));

            SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "WEEKLY");

            assertThat(result.getTotalSales()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
            assertThat(result.getTotalOrders()).isGreaterThanOrEqualTo(0);
        }

        @Test
        @DisplayName("returns zero totalSales for empty orders")
        void returnsZeroSalesForEmptyOrders() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "WEEKLY");

            assertThat(result.getTotalSales()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTotalOrders()).isZero();
        }

        @Test
        @DisplayName("calculates average order value correctly")
        void calculatesAverageOrderValue() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(300.0),
                deliveryOrder(500.0)
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "WEEKLY");

            // totalOrders = 2 in one of the 7 days, totalSales = 800
            assertThat(result.getTotalSales()).isEqualByComparingTo(new BigDecimal("800.0"));
        }
    }

    // ── getOrderTypeBreakdown ─────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrderTypeBreakdown")
    class GetOrderTypeBreakdown {

        @Test
        @DisplayName("groups orders by type correctly")
        void groupsOrdersByType() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(300.0),
                deliveryOrder(200.0),
                takeawayOrder(400.0),
                dineInOrder(100.0)
            );
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            OrderTypeBreakdownResponse result = analyticsService.getOrderTypeBreakdown("store-1");

            assertThat(result.getBreakdown()).hasSize(3);
            assertThat(result.getTotalOrders()).isEqualTo(4);
        }

        @Test
        @DisplayName("returns non-null with empty orders")
        void returnsNonNullForEmpty() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            OrderTypeBreakdownResponse result = analyticsService.getOrderTypeBreakdown("store-1");

            assertThat(result).isNotNull();
            assertThat(result.getBreakdown()).isEmpty();
        }

        @Test
        @DisplayName("sorts breakdown by count descending")
        void sortsByCountDescending() {
            List<Map<String, Object>> orders = new ArrayList<>();
            orders.add(deliveryOrder(100.0));
            orders.add(deliveryOrder(200.0));
            orders.add(deliveryOrder(300.0));
            orders.add(takeawayOrder(400.0));
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            OrderTypeBreakdownResponse result = analyticsService.getOrderTypeBreakdown("store-1");

            assertThat(result.getBreakdown().get(0).getOrderType()).isEqualTo("DELIVERY");
            assertThat(result.getBreakdown().get(0).getCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("calculates percentage of total sales per type")
        void calculatesPercentageOfTotalSales() {
            List<Map<String, Object>> orders = List.of(
                deliveryOrder(500.0),
                takeawayOrder(500.0)
            );
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            OrderTypeBreakdownResponse result = analyticsService.getOrderTypeBreakdown("store-1");

            result.getBreakdown().forEach(bd ->
                assertThat(bd.getPercentage()).isGreaterThan(BigDecimal.ZERO)
            );
        }
    }

    // ── getPeakHours ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getPeakHours")
    class GetPeakHours {

        @Test
        @DisplayName("returns 24 hourly data points")
        void returns24HourlyDataPoints() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            PeakHoursResponse result = analyticsService.getPeakHours("store-1");

            assertThat(result.getHourlyData()).hasSize(24);
        }

        @Test
        @DisplayName("identifies peak hour from orders with createdAt")
        void identifiesPeakHour() {
            List<Map<String, Object>> orders = new ArrayList<>();
            // 3 orders at 12pm, 1 order at 6pm
            for (int i = 0; i < 3; i++) {
                Map<String, Object> o = new HashMap<>();
                o.put("orderType", "DELIVERY");
                o.put("status", "DELIVERED");
                o.put("total", 200.0);
                o.put("createdAt", LocalDateTime.now().withHour(12));
                orders.add(o);
            }
            Map<String, Object> o2 = new HashMap<>();
            o2.put("orderType", "DELIVERY");
            o2.put("status", "DELIVERED");
            o2.put("total", 100.0);
            o2.put("createdAt", LocalDateTime.now().withHour(18));
            orders.add(o2);
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(orders);

            PeakHoursResponse result = analyticsService.getPeakHours("store-1");

            assertThat(result.getPeakHour()).isEqualTo(12);
            assertThat(result.getPeakHourOrders()).isEqualTo(3);
        }

        @Test
        @DisplayName("formats hour labels correctly: 0→12 AM, 12→12 PM, 13→1 PM")
        void formatsHourLabelsCorrectly() {
            when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());

            PeakHoursResponse result = analyticsService.getPeakHours("store-1");

            assertThat(result.getHourlyData().get(0).getLabel()).isEqualTo("12 AM");
            assertThat(result.getHourlyData().get(12).getLabel()).isEqualTo("12 PM");
            assertThat(result.getHourlyData().get(13).getLabel()).isEqualTo("1 PM");
            assertThat(result.getHourlyData().get(6).getLabel()).isEqualTo("6 AM");
        }
    }

    // ── getStaffLeaderboard ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getStaffLeaderboard")
    class GetStaffLeaderboard {

        @Test
        @DisplayName("ranks staff by sales descending")
        void ranksStaffBySalesDescending() {
            List<Map<String, Object>> staffList = List.of(
                Map.of("id", "s1", "name", "Alice"),
                Map.of("id", "s2", "name", "Bob")
            );
            List<Map<String, Object>> orders = new ArrayList<>();
            // s1 gets 3 completed orders, s2 gets 1
            for (int i = 0; i < 3; i++) {
                Map<String, Object> o = new HashMap<>();
                o.put("orderType", "DELIVERY");
                o.put("status", "DELIVERED");
                o.put("total", 100.0);
                o.put("createdByStaffId", "s1");
                orders.add(o);
            }
            Map<String, Object> o2 = new HashMap<>();
            o2.put("orderType", "DELIVERY");
            o2.put("status", "DELIVERED");
            o2.put("total", 50.0);
            o2.put("createdByStaffId", "s2");
            orders.add(o2);

            when(userServiceClient.getStaffByStore("store-1")).thenReturn(staffList);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            StaffLeaderboardResponse result = analyticsService.getStaffLeaderboard("store-1", "TODAY");

            assertThat(result.getRankings().get(0).getStaffId()).isEqualTo("s1");
            assertThat(result.getRankings().get(0).getRank()).isEqualTo(1);
            assertThat(result.getRankings().get(1).getStaffId()).isEqualTo("s2");
            assertThat(result.getRankings().get(1).getRank()).isEqualTo(2);
        }

        @Test
        @DisplayName("returns empty rankings when no staff")
        void returnsEmptyRankingsForNoStaff() {
            when(userServiceClient.getStaffByStore("store-1")).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            StaffLeaderboardResponse result = analyticsService.getStaffLeaderboard("store-1", "TODAY");

            assertThat(result.getRankings()).isEmpty();
            assertThat(result.getTotalStaff()).isZero();
        }

        @Test
        @DisplayName("uses WEEK period — start date is 7 days back")
        void usesWeekPeriod() {
            when(userServiceClient.getStaffByStore(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            StaffLeaderboardResponse result = analyticsService.getStaffLeaderboard("store-1", "WEEK");

            assertThat(result.getPeriod()).isEqualTo("WEEK");
        }

        @Test
        @DisplayName("assigns percentage of total sales to each ranking")
        void assignsPercentOfTotalSales() {
            List<Map<String, Object>> staffList = List.of(
                Map.of("id", "s1", "name", "Alice"),
                Map.of("id", "s2", "name", "Bob")
            );
            Map<String, Object> o1 = new HashMap<>();
            o1.put("orderType", "DELIVERY");
            o1.put("status", "DELIVERED");
            o1.put("total", 500.0);
            o1.put("createdByStaffId", "s1");
            Map<String, Object> o2 = new HashMap<>();
            o2.put("orderType", "DELIVERY");
            o2.put("status", "DELIVERED");
            o2.put("total", 500.0);
            o2.put("createdByStaffId", "s2");

            when(userServiceClient.getStaffByStore(any())).thenReturn(staffList);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(o1, o2));

            StaffLeaderboardResponse result = analyticsService.getStaffLeaderboard("store-1", "TODAY");

            result.getRankings().forEach(r ->
                assertThat(r.getPercentOfTotalSales()).isGreaterThan(BigDecimal.ZERO)
            );
        }
    }

    // ── getTopProducts ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTopProducts")
    class GetTopProducts {

        private Map<String, Object> orderWithItems(List<Map<String, Object>> items) {
            Map<String, Object> order = new HashMap<>();
            order.put("orderType", "DELIVERY");
            order.put("status", "DELIVERED");
            order.put("items", items);
            return order;
        }

        private Map<String, Object> item(String id, String name, int qty, double price) {
            Map<String, Object> item = new HashMap<>();
            item.put("menuItemId", id);
            item.put("itemName", name);
            item.put("quantity", qty);
            item.put("price", price);
            item.put("category", "Food");
            return item;
        }

        @Test
        @DisplayName("aggregates quantities across orders for same product")
        void aggregatesQuantitiesAcrossOrders() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(item("P1", "Biryani", 2, 150.0))),
                orderWithItems(List.of(item("P1", "Biryani", 3, 150.0)))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "QUANTITY");

            assertThat(result.getTopProducts()).hasSize(1);
            assertThat(result.getTopProducts().get(0).getQuantitySold()).isEqualTo(5);
        }

        @Test
        @DisplayName("sorts by REVENUE when sortBy=REVENUE")
        void sortsByRevenue() {
            // Biryani: 1 × 300 = 300 revenue; Curry: 10 × 50 = 500 revenue → Curry wins by revenue
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(
                    item("P1", "Biryani", 1, 300.0),
                    item("P2", "Curry", 10, 50.0)
                ))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "REVENUE");

            assertThat(result.getTopProducts().get(0).getItemName()).isEqualTo("Curry");
            assertThat(result.getSortBy()).isEqualTo("REVENUE");
        }

        @Test
        @DisplayName("sorts by QUANTITY by default")
        void sortsByQuantityDefault() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(
                    item("P1", "Biryani", 1, 300.0),
                    item("P2", "Curry", 10, 50.0)
                ))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "QUANTITY");

            assertThat(result.getTopProducts().get(0).getItemName()).isEqualTo("Curry");
        }

        @Test
        @DisplayName("assigns ranks starting from 1")
        void assignsRanks() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(
                    item("P1", "Biryani", 5, 100.0),
                    item("P2", "Curry", 3, 80.0),
                    item("P3", "Naan", 2, 30.0)
                ))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "QUANTITY");

            assertThat(result.getTopProducts().get(0).getRank()).isEqualTo(1);
            assertThat(result.getTopProducts().get(1).getRank()).isEqualTo(2);
        }

        @Test
        @DisplayName("returns empty list when no orders")
        void returnsEmptyForNoOrders() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "QUANTITY");

            assertThat(result.getTopProducts()).isEmpty();
        }

        @Test
        @DisplayName("limits result to 20 products max")
        void limitsTo20Products() {
            List<Map<String, Object>> items = new ArrayList<>();
            for (int i = 0; i < 25; i++) {
                items.add(item("P" + i, "Item" + i, 1, 100.0));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(
                List.of(orderWithItems(items))
            );

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "TODAY", "QUANTITY");

            assertThat(result.getTopProducts()).hasSizeLessThanOrEqualTo(20);
        }

        @Test
        @DisplayName("handles WEEK period — uses 7-day range")
        void handlesWeekPeriod() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            TopProductsResponse result = analyticsService.getTopProducts("store-1", "WEEK", "QUANTITY");

            assertThat(result.getPeriod()).isEqualTo("WEEK");
        }
    }

    // ── recordOrderEvent / recordPaymentEvent / recordAggregatorOrderEvent ────

    @Nested
    @DisplayName("event recording methods")
    class EventRecording {

        @Test
        @DisplayName("recordOrderEvent does not throw")
        void recordOrderEventDoesNotThrow() {
            analyticsService.recordOrderEvent("ord-1", "store-1", "cust-1", "DELIVERY", BigDecimal.valueOf(300), "CREATED");
        }

        @Test
        @DisplayName("recordPaymentEvent does not throw")
        void recordPaymentEventDoesNotThrow() {
            analyticsService.recordPaymentEvent("pay-1", "ord-1", BigDecimal.valueOf(300), "CARD", true);
        }

        @Test
        @DisplayName("recordAggregatorOrderEvent does not throw")
        void recordAggregatorOrderEventDoesNotThrow() {
            analyticsService.recordAggregatorOrderEvent(
                "ord-1", "store-1", "ZOMATO",
                BigDecimal.valueOf(500), BigDecimal.valueOf(50), BigDecimal.valueOf(450), "INR"
            );
        }
    }
}
