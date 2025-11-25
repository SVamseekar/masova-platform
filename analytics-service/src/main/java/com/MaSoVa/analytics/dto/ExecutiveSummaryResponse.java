package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveSummaryResponse {

    private String reportPeriod; // "WEEK", "MONTH", "QUARTER", "YEAR"
    private LocalDate startDate;
    private LocalDate endDate;
    private FinancialSummary financialSummary;
    private OperationalMetrics operationalMetrics;
    private List<KPITile> kpiTiles;
    private GrowthMetrics growthMetrics;
    private List<TopPerformer> topPerformers;
    private List<ActionableInsight> insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialSummary {
        private BigDecimal totalRevenue; // INR
        private BigDecimal totalCosts; // INR
        private BigDecimal grossProfit; // INR
        private BigDecimal netProfit; // INR
        private BigDecimal grossProfitMargin; // Percentage
        private BigDecimal netProfitMargin; // Percentage
        private BigDecimal operatingExpenses; // INR
        private BigDecimal ebitda; // INR
        private BigDecimal roi; // Percentage - Return on Investment
        private Map<String, BigDecimal> revenueByChannel; // "DINE_IN", "DELIVERY", "PICKUP"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationalMetrics {
        private int totalOrders;
        private BigDecimal averageOrderValue; // INR
        private int totalCustomers;
        private int newCustomers;
        private int activeCustomers;
        private BigDecimal customerRetentionRate; // Percentage
        private BigDecimal averageDeliveryTime; // Minutes
        private BigDecimal orderAccuracyRate; // Percentage
        private int totalMenuItems;
        private int totalStaff;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KPITile {
        private String kpiName;
        private String category; // "Financial", "Operational", "Customer", "Growth"
        private BigDecimal currentValue;
        private String unit; // "INR", "%", "#", "mins"
        private BigDecimal previousValue;
        private BigDecimal percentChange;
        private String trend; // "UP", "DOWN", "STABLE"
        private String status; // "Excellent", "Good", "Warning", "Critical"
        private BigDecimal target;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthMetrics {
        private BigDecimal revenueGrowthRate; // Percentage
        private BigDecimal customerGrowthRate; // Percentage
        private BigDecimal orderGrowthRate; // Percentage
        private BigDecimal profitGrowthRate; // Percentage
        private BigDecimal marketShareGrowth; // Percentage (if applicable)
        private String projectedAnnualRevenue; // INR - Based on current growth
        private List<GrowthDriver> topDrivers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthDriver {
        private String driverName;
        private String description;
        private BigDecimal contribution; // Percentage of total growth
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPerformer {
        private String category; // "Store", "Staff", "Product", "Customer"
        private String name;
        private String id;
        private BigDecimal value;
        private String metric; // "Sales", "Orders", "Rating"
        private int rank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionableInsight {
        private String priority; // "HIGH", "MEDIUM", "LOW"
        private String category; // "Revenue", "Cost", "Customer", "Operations"
        private String title;
        private String description;
        private String recommendation;
        private BigDecimal potentialImpact; // INR or percentage
        private String impactType; // "Revenue Increase", "Cost Reduction", "Efficiency Gain"
    }
}
