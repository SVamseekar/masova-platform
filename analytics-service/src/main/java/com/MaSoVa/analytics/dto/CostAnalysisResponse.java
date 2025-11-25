package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAnalysisResponse {

    private String period; // "TODAY", "WEEK", "MONTH"
    private BigDecimal totalRevenue; // INR
    private BigDecimal totalCosts; // INR
    private BigDecimal totalProfit; // INR
    private BigDecimal profitMargin; // Percentage
    private CostBreakdown costBreakdown;
    private List<IngredientCost> ingredientCosts;
    private List<WasteCost> wasteCosts;
    private List<OrderCostAnalysis> topCostOrders;
    private List<SupplierComparison> supplierComparisons;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostBreakdown {
        private BigDecimal ingredientCosts; // INR
        private BigDecimal wasteCosts; // INR
        private BigDecimal laborCosts; // INR
        private BigDecimal overheadCosts; // INR
        private BigDecimal deliveryCosts; // INR
        private BigDecimal otherCosts; // INR
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IngredientCost {
        private String ingredientId;
        private String ingredientName;
        private BigDecimal quantityUsed;
        private String unit;
        private BigDecimal costPerUnit; // INR
        private BigDecimal totalCost; // INR
        private BigDecimal percentOfTotalCost;
        private String trend; // "UP", "DOWN", "STABLE"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WasteCost {
        private String itemName;
        private BigDecimal quantityWasted;
        private String unit;
        private BigDecimal estimatedCost; // INR
        private String reason; // "Expired", "Spoiled", "Over-prepared", "Quality Issue"
        private LocalDate date;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderCostAnalysis {
        private String orderId;
        private BigDecimal revenue; // INR
        private BigDecimal cost; // INR
        private BigDecimal profit; // INR
        private BigDecimal profitMargin; // Percentage
        private int itemCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierComparison {
        private String ingredientName;
        private List<SupplierPrice> suppliers;
        private String recommendedSupplier;
        private BigDecimal potentialSavings; // INR per month
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierPrice {
        private String supplierId;
        private String supplierName;
        private BigDecimal pricePerUnit; // INR
        private String unit;
        private String quality; // "Premium", "Standard", "Budget"
        private int deliveryDays;
    }
}
