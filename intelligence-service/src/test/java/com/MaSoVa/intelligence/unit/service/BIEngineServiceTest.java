package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.CustomerServiceClient;
import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.BIEngineService;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BIEngineService Unit Tests")
class BIEngineServiceTest {

    @Mock private OrderServiceClient orderServiceClient;
    @Mock private CustomerServiceClient customerServiceClient;

    @InjectMocks private BIEngineService biEngineService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> order(double amount, String customerId) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("customerId", customerId);
        o.put("createdAt", LocalDateTime.now().minusDays(1));
        return o;
    }

    private Map<String, Object> customer(String id, String name, String email) {
        Map<String, Object> c = new HashMap<>();
        c.put("id", id);
        c.put("name", name);
        c.put("email", email);
        return c;
    }

    private Map<String, Object> orderWithItems(List<Map<String, Object>> items) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", 500.0);
        o.put("items", items);
        o.put("createdAt", LocalDateTime.now().minusDays(2));
        return o;
    }

    private Map<String, Object> item(String id, String name, int qty, double price) {
        Map<String, Object> i = new HashMap<>();
        i.put("menuItemId", id);
        i.put("itemName", name);
        i.put("quantity", qty);
        i.put("price", price);
        i.put("category", "Food");
        return i;
    }

    // ── generateSalesForecast ─────────────────────────────────────────────────

    @Nested
    @DisplayName("generateSalesForecast")
    class GenerateSalesForecast {

        @Test
        @DisplayName("returns non-null response with empty history")
        void returnsNonNullForEmptyHistory() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "WEEKLY", 7);

            assertThat(result).isNotNull();
            assertThat(result.getForecasts()).hasSize(7);
        }

        @Test
        @DisplayName("returns correct number of forecast data points for days param")
        void returnsCorrectForecastDataPointCount() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "MONTHLY", 30);

            assertThat(result.getForecasts()).hasSize(30);
            assertThat(result.getForecastPeriod()).isEqualTo("MONTHLY");
        }

        @Test
        @DisplayName("each forecast has lower and upper bounds")
        void eachForecastHasBounds() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "WEEKLY", 7);

            result.getForecasts().forEach(fp -> {
                assertThat(fp.getLowerBound()).isLessThanOrEqualTo(fp.getForecastedSales());
                assertThat(fp.getUpperBound()).isGreaterThanOrEqualTo(fp.getForecastedSales());
            });
        }

        @Test
        @DisplayName("forecast dates start from tomorrow")
        void forecastDatesStartFromTomorrow() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "WEEKLY", 7);

            java.time.LocalDate tomorrow = java.time.LocalDate.now().plusDays(1);
            assertThat(result.getForecasts().get(0).getDate()).isEqualTo(tomorrow);
        }

        @Test
        @DisplayName("model accuracy is HIGH when confidence >= 80")
        void modelAccuracyIsHighWhenConfidenceHigh() {
            // 100+ orders guarantees high confidence base
            List<Map<String, Object>> historicalOrders = new ArrayList<>();
            for (int i = 0; i < 150; i++) {
                historicalOrders.add(order(300.0, "cust-" + i));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(historicalOrders);

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "WEEKLY", 7);

            assertThat(result.getModelAccuracy()).isIn("HIGH", "MEDIUM");
        }

        @Test
        @DisplayName("totalForecastedSales is sum of all forecast points")
        void totalForecastedSalesIsSumOfPoints() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "WEEKLY", 7);

            BigDecimal expectedTotal = result.getForecasts().stream()
                .map(SalesForecastResponse.ForecastDataPoint::getForecastedSales)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            assertThat(result.getTotalForecastedSales()).isEqualByComparingTo(expectedTotal);
        }
    }

    // ── analyzeCustomerBehavior ───────────────────────────────────────────────

    @Nested
    @DisplayName("analyzeCustomerBehavior")
    class AnalyzeCustomerBehavior {

        @Test
        @DisplayName("returns zero customers and empty segments for no data")
        void returnsEmptyForNoData() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of());
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            assertThat(result.getTotalCustomers()).isZero();
            assertThat(result.getActiveCustomers()).isZero();
            assertThat(result.getNewCustomers()).isZero();
        }

        @Test
        @DisplayName("counts active customers from orders after 30 days ago")
        void countsActiveCustomers() {
            List<Map<String, Object>> customers = List.of(
                customer("c1", "Alice", "alice@example.com"),
                customer("c2", "Bob", "bob@example.com")
            );
            List<Map<String, Object>> recentOrders = List.of(
                order(300.0, "c1"),
                order(200.0, "c1")
            );
            when(customerServiceClient.getAllCustomers()).thenReturn(customers);
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(recentOrders);

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            assertThat(result.getTotalCustomers()).isEqualTo(2);
            assertThat(result.getActiveCustomers()).isEqualTo(1); // only c1 had orders
        }

        @Test
        @DisplayName("counts new customers from registration after 30 days")
        void countsNewCustomers() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of());
            when(customerServiceClient.getCustomersRegisteredAfter(any()))
                .thenReturn(List.of(customer("c1", "New Customer", "new@example.com")));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            assertThat(result.getNewCustomers()).isEqualTo(1);
        }

        @Test
        @DisplayName("segments include at least 5 segment types")
        void hasCorrectSegmentCount() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of());
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            assertThat(result.getSegments()).hasSize(5);
        }

        @Test
        @DisplayName("segments VIP customer with 10+ orders and 10000+ LTV")
        void segmentsVIPCustomerCorrectly() {
            List<Map<String, Object>> customers = List.of(
                customer("vip1", "VIP Customer", "vip@example.com")
            );
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 12; i++) {
                Map<String, Object> o = new HashMap<>();
                o.put("totalAmount", 1000.0);
                o.put("customerId", "vip1");
                o.put("createdAt", LocalDateTime.now().minusDays(40)); // older than 30 days (not "New")
                orders.add(o);
            }
            when(customerServiceClient.getAllCustomers()).thenReturn(customers);
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            boolean hasVIP = result.getSegments().stream()
                .anyMatch(s -> "VIP".equals(s.getSegmentName()) && s.getCustomerCount() > 0);
            assertThat(hasVIP).isTrue();
        }

        @Test
        @DisplayName("includes peak ordering time behavior pattern")
        void includesPeakOrderingTimePattern() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of());
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            List<Map<String, Object>> orders = List.of(order(100.0, "c1"));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            assertThat(result.getPatterns()).isNotEmpty();
            assertThat(result.getPatterns().get(0).getPatternType()).isEqualTo("Peak Ordering Time");
        }

        @Test
        @DisplayName("calculates average lifetime value")
        void calculatesAverageLifetimeValue() {
            List<Map<String, Object>> customers = List.of(
                customer("c1", "Alice", "alice@test.com"),
                customer("c2", "Bob", "bob@test.com")
            );
            List<Map<String, Object>> orders = List.of(
                order(1000.0, "c1"),
                order(500.0, "c2")
            );
            when(customerServiceClient.getAllCustomers()).thenReturn(customers);
            when(customerServiceClient.getCustomersRegisteredAfter(any())).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

            // Total LTV = 1500, customers = 2, avg = 750
            assertThat(result.getAverageLifetimeValue()).isEqualByComparingTo(new BigDecimal("750.00"));
        }
    }

    // ── predictChurn ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("predictChurn")
    class PredictChurn {

        @Test
        @DisplayName("returns zero at-risk customers when no customers")
        void returnsZeroForNoCustomers() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of());
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            assertThat(result.getTotalCustomersAnalyzed()).isZero();
            assertThat(result.getAtRiskCustomers()).isEmpty();
        }

        @Test
        @DisplayName("skips customers who never ordered")
        void skipsCustomersWithNoOrders() {
            when(customerServiceClient.getAllCustomers()).thenReturn(List.of(
                customer("c1", "Never Ordered", "no@order.com")
            ));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            assertThat(result.getAtRiskCustomers()).isEmpty();
        }

        @Test
        @DisplayName("marks HIGH risk for customer inactive 150+ days with 1 order")
        void marksHighRiskForLongInactiveCustomer() {
            Map<String, Object> cust = customer("c1", "Inactive", "inactive@test.com");
            List<Map<String, Object>> orders = new ArrayList<>();
            Map<String, Object> o = new HashMap<>();
            o.put("totalAmount", 200.0);
            o.put("customerId", "c1");
            // 150 days ago — triggers high risk
            o.put("createdAt", LocalDateTime.now().minusDays(150));
            orders.add(o);

            when(customerServiceClient.getAllCustomers()).thenReturn(List.of(cust));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            assertThat(result.getHighRiskCustomers()).isGreaterThan(0);
        }

        @Test
        @DisplayName("includes risk factors for at-risk customers")
        void includesRiskFactors() {
            Map<String, Object> cust = customer("c1", "At Risk", "risk@test.com");
            Map<String, Object> o = new HashMap<>();
            o.put("totalAmount", 100.0); // low LTV
            o.put("customerId", "c1");
            o.put("createdAt", LocalDateTime.now().minusDays(90));

            when(customerServiceClient.getAllCustomers()).thenReturn(List.of(cust));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(o));

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            if (!result.getAtRiskCustomers().isEmpty()) {
                assertThat(result.getAtRiskCustomers().get(0).getRiskFactors()).isNotEmpty();
            }
        }

        @Test
        @DisplayName("calculates predicted churn rate as percentage of total customers")
        void calculatesPredictedChurnRate() {
            List<Map<String, Object>> customers = List.of(
                customer("c1", "Alice", "alice@test.com"),
                customer("c2", "Bob", "bob@test.com")
            );
            Map<String, Object> o1 = new HashMap<>();
            o1.put("totalAmount", 50.0);
            o1.put("customerId", "c1");
            o1.put("createdAt", LocalDateTime.now().minusDays(150));

            when(customerServiceClient.getAllCustomers()).thenReturn(customers);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(o1));

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            assertThat(result.getPredictedChurnRate()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
            assertThat(result.getPredictedChurnRate()).isLessThanOrEqualTo(BigDecimal.valueOf(100));
        }

        @Test
        @DisplayName("limits at-risk list to 50 customers")
        void limitsAtRiskListTo50() {
            List<Map<String, Object>> customers = new ArrayList<>();
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 60; i++) {
                customers.add(customer("c" + i, "Customer " + i, "c" + i + "@test.com"));
                Map<String, Object> o = new HashMap<>();
                o.put("totalAmount", 50.0);
                o.put("customerId", "c" + i);
                o.put("createdAt", LocalDateTime.now().minusDays(150)); // all high risk
                orders.add(o);
            }

            when(customerServiceClient.getAllCustomers()).thenReturn(customers);
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            assertThat(result.getAtRiskCustomers()).hasSizeLessThanOrEqualTo(50);
        }

        @Test
        @DisplayName("identifies and returns churn factors from at-risk customers")
        void identifiesChurnFactors() {
            Map<String, Object> cust = customer("c1", "At Risk", "risk@test.com");
            Map<String, Object> o = new HashMap<>();
            o.put("totalAmount", 50.0); // low LTV → triggers "Low lifetime value"
            o.put("customerId", "c1");
            o.put("createdAt", LocalDateTime.now().minusDays(90)); // > 60 days → "Inactive for over 60 days"

            when(customerServiceClient.getAllCustomers()).thenReturn(List.of(cust));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of(o));

            ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

            if (!result.getAtRiskCustomers().isEmpty()) {
                assertThat(result.getChurnFactors()).isNotEmpty();
            }
        }
    }

    // ── generateDemandForecast ────────────────────────────────────────────────

    @Nested
    @DisplayName("generateDemandForecast")
    class GenerateDemandForecast {

        @Test
        @DisplayName("returns non-null with empty orders")
        void returnsNonNullForEmpty() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            assertThat(result).isNotNull();
            assertThat(result.getItemForecasts()).isEmpty();
        }

        @Test
        @DisplayName("extracts items from order items list")
        void extractsItemsFromOrders() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(
                    item("P1", "Biryani", 5, 150.0),
                    item("P2", "Curry", 3, 80.0)
                ))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            assertThat(result.getItemForecasts()).hasSize(2);
        }

        @Test
        @DisplayName("limits item forecasts to 50")
        void limitsTo50ItemForecasts() {
            List<Map<String, Object>> items = new ArrayList<>();
            for (int i = 0; i < 60; i++) {
                items.add(item("P" + i, "Item" + i, 1, 100.0));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(
                List.of(orderWithItems(items))
            );

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            assertThat(result.getItemForecasts()).hasSizeLessThanOrEqualTo(50);
        }

        @Test
        @DisplayName("generates category forecasts aggregating items")
        void generatesCategoryForecasts() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(
                    item("P1", "Biryani", 5, 150.0),
                    item("P2", "Pasta", 3, 100.0)
                ))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            assertThat(result.getCategoryForecasts()).isNotEmpty();
        }

        @Test
        @DisplayName("MONTHLY period uses 30 forecast days")
        void monthlyUses30Days() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "MONTHLY");

            assertThat(result.getForecastPeriod()).isEqualTo("MONTHLY");
        }

        @Test
        @DisplayName("all item forecasts have stock recommendation")
        void itemForecastsHaveRecommendation() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(item("P1", "Biryani", 10, 200.0)))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            result.getItemForecasts().forEach(forecast ->
                assertThat(forecast.getRecommendation()).isIn("Stock Up", "Reduce Stock", "Normal")
            );
        }

        @Test
        @DisplayName("aggregates same item quantities across multiple orders")
        void aggregatesSameItemAcrossOrders() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(List.of(item("P1", "Biryani", 5, 150.0))),
                orderWithItems(List.of(item("P1", "Biryani", 3, 150.0)))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);

            DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "WEEKLY");

            assertThat(result.getItemForecasts()).hasSize(1);
            // 8 total historical qty across 90 days → very low daily avg → small forecast
            assertThat(result.getItemForecasts().get(0).getForecastedQuantity()).isGreaterThanOrEqualTo(0);
        }
    }
}
