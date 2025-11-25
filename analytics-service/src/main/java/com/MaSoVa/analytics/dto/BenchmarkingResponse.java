package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkingResponse {

    private String period; // "WEEK", "MONTH", "QUARTER"
    private List<StoreComparison> storeComparisons;
    private IndustryBenchmarks industryBenchmarks;
    private List<KPIComparison> kpiComparisons;
    private List<PerformanceInsight> insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreComparison {
        private String storeId;
        private String storeName;
        private String location;
        private int rank;
        private BigDecimal totalSales; // INR
        private int totalOrders;
        private BigDecimal averageOrderValue; // INR
        private BigDecimal profitMargin; // Percentage
        private int activeCustomers;
        private BigDecimal customerSatisfaction; // 0-5
        private String performanceLevel; // "Excellent", "Good", "Average", "Needs Improvement"
        private Map<String, BigDecimal> kpiScores; // KPI name -> Score
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryBenchmarks {
        private BigDecimal averageAOV; // INR - Industry average
        private BigDecimal averageProfitMargin; // Percentage
        private BigDecimal averageCustomerRetention; // Percentage
        private BigDecimal averageDeliveryTime; // Minutes
        private String dataSource;
        private String industrySegment; // "Fast Food", "Fine Dining", "Quick Service"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KPIComparison {
        private String kpiName;
        private String unit;
        private BigDecimal yourValue;
        private BigDecimal networkAverage; // Average across all stores
        private BigDecimal industryAverage;
        private BigDecimal target;
        private String performance; // "Above Target", "On Target", "Below Target"
        private BigDecimal percentDifferenceFromTarget;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceInsight {
        private String insightType; // "Strength", "Weakness", "Opportunity", "Threat"
        private String title;
        private String description;
        private String recommendation;
        private BigDecimal priority; // 0-100
    }
}
