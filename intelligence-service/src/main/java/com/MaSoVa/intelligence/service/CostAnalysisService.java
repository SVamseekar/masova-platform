package com.MaSoVa.intelligence.service;

import com.MaSoVa.intelligence.client.*;
import com.MaSoVa.intelligence.dto.CostAnalysisResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CostAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(CostAnalysisService.class);

    private final OrderServiceClient orderServiceClient;
    private final InventoryServiceClient inventoryServiceClient;

    public CostAnalysisService(OrderServiceClient orderServiceClient,
                               InventoryServiceClient inventoryServiceClient) {
        this.orderServiceClient = orderServiceClient;
        this.inventoryServiceClient = inventoryServiceClient;
    }

    /**
     * Comprehensive cost analysis for a given period
     */
    @Cacheable(value = "costAnalysis", key = "#storeId + '-' + #period")
    public CostAnalysisResponse analyzeCosts(String storeId, String period) {
        log.info("Analyzing costs for store: {}, period: {}", storeId, period);

        LocalDate today = LocalDate.now();
        LocalDate startDate;

        switch (period.toUpperCase()) {
            case "WEEK":
                startDate = today.minusDays(6);
                break;
            case "MONTH":
                startDate = today.minusDays(29);
                break;
            default:
                startDate = today;
        }

        // Get orders for the period
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        // Calculate total revenue
        BigDecimal totalRevenue = orders.stream()
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get inventory items for cost data
        List<Map<String, Object>> inventoryItems = inventoryServiceClient.getAllInventoryItems();

        // Calculate ingredient costs
        List<CostAnalysisResponse.IngredientCost> ingredientCosts = calculateIngredientCosts(orders, inventoryItems);
        BigDecimal totalIngredientCost = ingredientCosts.stream()
            .map(CostAnalysisResponse.IngredientCost::getTotalCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Estimate other costs (simplified)
        BigDecimal laborCosts = totalRevenue.multiply(BigDecimal.valueOf(0.25)); // 25% of revenue
        BigDecimal overheadCosts = totalRevenue.multiply(BigDecimal.valueOf(0.15)); // 15% of revenue
        BigDecimal deliveryCosts = calculateDeliveryCosts(orders);
        BigDecimal wasteCosts = BigDecimal.valueOf(500); // Simplified flat rate
        BigDecimal otherCosts = BigDecimal.valueOf(1000); // Miscellaneous

        // Total costs
        BigDecimal totalCosts = totalIngredientCost
            .add(laborCosts)
            .add(overheadCosts)
            .add(deliveryCosts)
            .add(wasteCosts)
            .add(otherCosts);

        BigDecimal totalProfit = totalRevenue.subtract(totalCosts);
        BigDecimal profitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
            ? totalProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        CostAnalysisResponse.CostBreakdown costBreakdown = CostAnalysisResponse.CostBreakdown.builder()
            .ingredientCosts(totalIngredientCost)
            .wasteCosts(wasteCosts)
            .laborCosts(laborCosts)
            .overheadCosts(overheadCosts)
            .deliveryCosts(deliveryCosts)
            .otherCosts(otherCosts)
            .build();

        // Generate waste cost data (simplified mock data)
        List<CostAnalysisResponse.WasteCost> wasteCostsList = generateWasteCosts();

        // Analyze order-level costs
        List<CostAnalysisResponse.OrderCostAnalysis> orderCostAnalyses = analyzeOrderCosts(orders);

        // Supplier comparisons (mock data)
        List<CostAnalysisResponse.SupplierComparison> supplierComparisons = generateSupplierComparisons();

        return CostAnalysisResponse.builder()
                .period(period.toUpperCase())
                .totalRevenue(totalRevenue)
                .totalCosts(totalCosts)
                .totalProfit(totalProfit)
                .profitMargin(profitMargin)
                .costBreakdown(costBreakdown)
                .ingredientCosts(ingredientCosts.stream().limit(20).collect(Collectors.toList()))
                .wasteCosts(wasteCostsList)
                .topCostOrders(orderCostAnalyses.stream().limit(10).collect(Collectors.toList()))
                .supplierComparisons(supplierComparisons)
                .build();
    }

    private List<CostAnalysisResponse.IngredientCost> calculateIngredientCosts(
        List<Map<String, Object>> orders,
        List<Map<String, Object>> inventoryItems
    ) {
        Map<String, IngredientUsage> ingredientUsage = new HashMap<>();

        // Extract items from orders
        for (Map<String, Object> order : orders) {
            Object itemsObj = order.get("items");
            if (itemsObj instanceof List<?> itemsList) {
                for (Object itemObj : itemsList) {
                    if (!(itemObj instanceof Map<?, ?>)) continue;
                    Map<?, ?> itemMap = (Map<?, ?>) itemObj;
                    // Simplified: Assume each menu item uses ingredients
                    // In reality, you'd have a mapping of menu items to ingredients
                    String itemName = (String) itemMap.get("itemName");
                    Object quantityObj = itemMap.get("quantity");
                    int quantity = quantityObj instanceof Number ? ((Number) quantityObj).intValue() : 0;

                    // Mock ingredient cost (₹50 per item on average)
                    BigDecimal costPerItem = BigDecimal.valueOf(50);
                    BigDecimal totalCost = costPerItem.multiply(BigDecimal.valueOf(quantity));

                    ingredientUsage.computeIfAbsent(itemName, k -> new IngredientUsage(itemName))
                        .addUsage(quantity, totalCost);
                }
            }
        }

        List<CostAnalysisResponse.IngredientCost> result = new ArrayList<>();
        BigDecimal totalCost = ingredientUsage.values().stream()
            .map(IngredientUsage::getTotalCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Map.Entry<String, IngredientUsage> entry : ingredientUsage.entrySet()) {
            IngredientUsage usage = entry.getValue();
            BigDecimal percentOfTotal = totalCost.compareTo(BigDecimal.ZERO) > 0
                ? usage.getTotalCost().divide(totalCost, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

            result.add(CostAnalysisResponse.IngredientCost.builder()
                .ingredientId(UUID.randomUUID().toString())
                .ingredientName(usage.getName())
                .quantityUsed(BigDecimal.valueOf(usage.getQuantity()))
                .unit("units")
                .costPerUnit(usage.getQuantity() > 0
                    ? usage.getTotalCost().divide(BigDecimal.valueOf(usage.getQuantity()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO)
                .totalCost(usage.getTotalCost())
                .percentOfTotalCost(percentOfTotal)
                .trend("STABLE")
                .build());
        }

        result.sort((a, b) -> b.getTotalCost().compareTo(a.getTotalCost()));
        return result;
    }

    private BigDecimal calculateDeliveryCosts(List<Map<String, Object>> orders) {
        long deliveryOrderCount = orders.stream()
            .filter(o -> "DELIVERY".equals(o.get("orderType")))
            .count();

        // Assume ₹30 per delivery
        return BigDecimal.valueOf(deliveryOrderCount * 30);
    }

    private List<CostAnalysisResponse.WasteCost> generateWasteCosts() {
        List<CostAnalysisResponse.WasteCost> wasteCosts = new ArrayList<>();

        wasteCosts.add(CostAnalysisResponse.WasteCost.builder()
            .itemName("Fresh Vegetables")
            .quantityWasted(BigDecimal.valueOf(5))
            .unit("kg")
            .estimatedCost(BigDecimal.valueOf(250))
            .reason("Spoiled")
            .date(LocalDate.now().minusDays(2))
            .build());

        wasteCosts.add(CostAnalysisResponse.WasteCost.builder()
            .itemName("Dairy Products")
            .quantityWasted(BigDecimal.valueOf(3))
            .unit("liters")
            .estimatedCost(BigDecimal.valueOf(150))
            .reason("Expired")
            .date(LocalDate.now().minusDays(1))
            .build());

        return wasteCosts;
    }

    private List<CostAnalysisResponse.OrderCostAnalysis> analyzeOrderCosts(List<Map<String, Object>> orders) {
        List<CostAnalysisResponse.OrderCostAnalysis> analyses = new ArrayList<>();

        for (Map<String, Object> order : orders) {
            String orderId = (String) order.get("id");
            BigDecimal revenue = getOrderAmount(order);

            // Estimate cost as 60% of revenue (typical food cost ratio)
            BigDecimal cost = revenue.multiply(BigDecimal.valueOf(0.60));
            BigDecimal profit = revenue.subtract(cost);
            BigDecimal profitMargin = revenue.compareTo(BigDecimal.ZERO) > 0
                ? profit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

            int itemCount = 0;
            Object itemsObj = order.get("items");
            if (itemsObj instanceof List<?> itemsList) {
                itemCount = itemsList.size();
            }

            analyses.add(CostAnalysisResponse.OrderCostAnalysis.builder()
                .orderId(orderId)
                .revenue(revenue)
                .cost(cost)
                .profit(profit)
                .profitMargin(profitMargin)
                .itemCount(itemCount)
                .build());
        }

        // Sort by profit descending
        analyses.sort((a, b) -> b.getProfit().compareTo(a.getProfit()));
        return analyses;
    }

    private List<CostAnalysisResponse.SupplierComparison> generateSupplierComparisons() {
        List<CostAnalysisResponse.SupplierComparison> comparisons = new ArrayList<>();

        // Mock supplier comparison
        List<CostAnalysisResponse.SupplierPrice> tomatoSuppliers = Arrays.asList(
            CostAnalysisResponse.SupplierPrice.builder()
                .supplierId("SUP001")
                .supplierName("Fresh Farms Co.")
                .pricePerUnit(BigDecimal.valueOf(40))
                .unit("kg")
                .quality("Premium")
                .deliveryDays(1)
                .build(),
            CostAnalysisResponse.SupplierPrice.builder()
                .supplierId("SUP002")
                .supplierName("Local Veggie Market")
                .pricePerUnit(BigDecimal.valueOf(35))
                .unit("kg")
                .quality("Standard")
                .deliveryDays(2)
                .build()
        );

        comparisons.add(CostAnalysisResponse.SupplierComparison.builder()
            .ingredientName("Tomatoes")
            .suppliers(tomatoSuppliers)
            .recommendedSupplier("SUP002")
            .potentialSavings(BigDecimal.valueOf(500))
            .build());

        return comparisons;
    }

    private BigDecimal getOrderAmount(Map<String, Object> order) {
        Object totalAmount = order.get("totalAmount");
        if (totalAmount instanceof Number) {
            return BigDecimal.valueOf(((Number) totalAmount).doubleValue());
        }
        return BigDecimal.ZERO;
    }

    // Helper class
    private static class IngredientUsage {
        private final String name;
        private int quantity;
        private BigDecimal totalCost;

        public IngredientUsage(String name) {
            this.name = name;
            this.quantity = 0;
            this.totalCost = BigDecimal.ZERO;
        }

        public void addUsage(int qty, BigDecimal cost) {
            this.quantity += qty;
            this.totalCost = this.totalCost.add(cost);
        }

        public String getName() { return name; }
        public int getQuantity() { return quantity; }
        public BigDecimal getTotalCost() { return totalCost; }
    }
}
