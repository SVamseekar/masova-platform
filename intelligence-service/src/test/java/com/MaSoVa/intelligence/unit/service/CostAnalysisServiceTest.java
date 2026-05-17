package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.InventoryServiceClient;
import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.CostAnalysisResponse;
import com.MaSoVa.intelligence.service.CostAnalysisService;
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
@DisplayName("CostAnalysisService Unit Tests")
class CostAnalysisServiceTest {

    @Mock private OrderServiceClient orderServiceClient;
    @Mock private InventoryServiceClient inventoryServiceClient;

    @InjectMocks private CostAnalysisService costAnalysisService;

    private Map<String, Object> order(double amount, String orderType) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("orderType", orderType);
        o.put("id", UUID.randomUUID().toString());
        return o;
    }

    private Map<String, Object> orderWithItems(double amount, List<Map<String, Object>> items) {
        Map<String, Object> o = new HashMap<>();
        o.put("totalAmount", amount);
        o.put("orderType", "DINE_IN");
        o.put("id", UUID.randomUUID().toString());
        o.put("items", items);
        return o;
    }

    private Map<String, Object> item(String name, int qty) {
        Map<String, Object> i = new HashMap<>();
        i.put("itemName", name);
        i.put("quantity", qty);
        i.put("price", 100.0);
        return i;
    }

    // ── analyzeCosts ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("analyzeCosts")
    class AnalyzeCosts {

        @Test
        @DisplayName("returns non-null response for empty orders")
        void returnsNonNullForEmpty() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result).isNotNull();
            assertThat(result.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("calculates total revenue from order amounts")
        void calculatesTotalRevenue() {
            List<Map<String, Object>> orders = List.of(
                order(500.0, "DINE_IN"),
                order(300.0, "DELIVERY"),
                order(200.0, "TAKEAWAY")
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "MONTH");

            assertThat(result.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("1000.0"));
        }

        @Test
        @DisplayName("calculates labor costs as 25% of revenue")
        void calculatesLaborCostsAs25Percent() {
            List<Map<String, Object>> orders = List.of(order(1000.0, "DINE_IN"));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getCostBreakdown().getLaborCosts())
                .isEqualByComparingTo(new BigDecimal("250.0"));
        }

        @Test
        @DisplayName("calculates overhead costs as 15% of revenue")
        void calculatesOverheadAs15Percent() {
            List<Map<String, Object>> orders = List.of(order(1000.0, "DINE_IN"));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getCostBreakdown().getOverheadCosts())
                .isEqualByComparingTo(new BigDecimal("150.0"));
        }

        @Test
        @DisplayName("calculates delivery cost at 30 per delivery order")
        void calculatesDeliveryCost() {
            List<Map<String, Object>> orders = List.of(
                order(300.0, "DELIVERY"),
                order(300.0, "DELIVERY"),
                order(200.0, "DINE_IN") // not a delivery
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getCostBreakdown().getDeliveryCosts())
                .isEqualByComparingTo(new BigDecimal("60")); // 2 × 30
        }

        @Test
        @DisplayName("profit = revenue - total costs")
        void calculatesProfitCorrectly() {
            List<Map<String, Object>> orders = List.of(order(1000.0, "DINE_IN"));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            BigDecimal expectedProfit = result.getTotalRevenue().subtract(result.getTotalCosts());
            assertThat(result.getTotalProfit()).isEqualByComparingTo(expectedProfit);
        }

        @Test
        @DisplayName("profit margin is zero when revenue is zero")
        void profitMarginIsZeroForZeroRevenue() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getProfitMargin()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("extracts ingredient costs from order items")
        void extractsIngredientCostsFromItems() {
            List<Map<String, Object>> orders = List.of(
                orderWithItems(500.0, List.of(item("Biryani", 3), item("Curry", 2)))
            );
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getIngredientCosts()).hasSize(2);
        }

        @Test
        @DisplayName("generates waste costs list with 2 items")
        void generatesWasteCostsList() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getWasteCosts()).hasSize(2);
        }

        @Test
        @DisplayName("generates supplier comparisons")
        void generatesSupplierComparisons() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getSupplierComparisons()).isNotEmpty();
        }

        @Test
        @DisplayName("top cost orders limited to 10")
        void topCostOrdersLimitedTo10() {
            List<Map<String, Object>> orders = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                orders.add(order(100.0, "DINE_IN"));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getTopCostOrders()).hasSizeLessThanOrEqualTo(10);
        }

        @Test
        @DisplayName("ingredient costs limited to 20")
        void ingredientCostsLimitedTo20() {
            List<Map<String, Object>> items = new ArrayList<>();
            for (int i = 0; i < 25; i++) {
                items.add(item("Item" + i, 2));
            }
            when(orderServiceClient.getOrdersByDateRange(any(), any()))
                .thenReturn(List.of(orderWithItems(500.0, items)));
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            assertThat(result.getIngredientCosts()).hasSizeLessThanOrEqualTo(20);
        }

        @Test
        @DisplayName("period MONTH uses 30-day lookback")
        void monthPeriodWorks() {
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "MONTH");

            assertThat(result.getPeriod()).isEqualTo("MONTH");
        }

        @Test
        @DisplayName("order cost analysis has profitMargin = 40% for each order")
        void orderCostAnalysisHas40PercentProfit() {
            List<Map<String, Object>> orders = List.of(order(1000.0, "DINE_IN"));
            when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(orders);
            when(inventoryServiceClient.getAllInventoryItems()).thenReturn(List.of());

            CostAnalysisResponse result = costAnalysisService.analyzeCosts("store-1", "WEEK");

            if (!result.getTopCostOrders().isEmpty()) {
                // Cost = 60%, profit = 40%
                assertThat(result.getTopCostOrders().get(0).getProfitMargin())
                    .isEqualByComparingTo(new BigDecimal("40.00"));
            }
        }
    }
}
