package com.MaSoVa.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class BenchmarkingResponse {

    private String period; // "WEEK", "MONTH", "QUARTER"
    private List<StoreComparison> storeComparisons;
    private IndustryBenchmarks industryBenchmarks;
    private List<KPIComparison> kpiComparisons;
    private List<PerformanceInsight> insights;

    public BenchmarkingResponse() {}

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public List<StoreComparison> getStoreComparisons() {
        return storeComparisons;
    }

    public void setStoreComparisons(List<StoreComparison> storeComparisons) {
        this.storeComparisons = storeComparisons;
    }

    public IndustryBenchmarks getIndustryBenchmarks() {
        return industryBenchmarks;
    }

    public void setIndustryBenchmarks(IndustryBenchmarks industryBenchmarks) {
        this.industryBenchmarks = industryBenchmarks;
    }

    public List<KPIComparison> getKpiComparisons() {
        return kpiComparisons;
    }

    public void setKpiComparisons(List<KPIComparison> kpiComparisons) {
        this.kpiComparisons = kpiComparisons;
    }

    public List<PerformanceInsight> getInsights() {
        return insights;
    }

    public void setInsights(List<PerformanceInsight> insights) {
        this.insights = insights;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final BenchmarkingResponse obj = new BenchmarkingResponse();

        public Builder period(String period) {
            obj.period = period;
            return this;
        }

        public Builder storeComparisons(List<StoreComparison> storeComparisons) {
            obj.storeComparisons = storeComparisons;
            return this;
        }

        public Builder industryBenchmarks(IndustryBenchmarks industryBenchmarks) {
            obj.industryBenchmarks = industryBenchmarks;
            return this;
        }

        public Builder kpiComparisons(List<KPIComparison> kpiComparisons) {
            obj.kpiComparisons = kpiComparisons;
            return this;
        }

        public Builder insights(List<PerformanceInsight> insights) {
            obj.insights = insights;
            return this;
        }

        public BenchmarkingResponse build() {
            return obj;
        }
    }

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

        public StoreComparison() {}

        public String getStoreId() {
            return storeId;
        }

        public void setStoreId(String storeId) {
            this.storeId = storeId;
        }

        public String getStoreName() {
            return storeName;
        }

        public void setStoreName(String storeName) {
            this.storeName = storeName;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
            this.rank = rank;
        }

        public BigDecimal getTotalSales() {
            return totalSales;
        }

        public void setTotalSales(BigDecimal totalSales) {
            this.totalSales = totalSales;
        }

        public int getTotalOrders() {
            return totalOrders;
        }

        public void setTotalOrders(int totalOrders) {
            this.totalOrders = totalOrders;
        }

        public BigDecimal getAverageOrderValue() {
            return averageOrderValue;
        }

        public void setAverageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
        }

        public BigDecimal getProfitMargin() {
            return profitMargin;
        }

        public void setProfitMargin(BigDecimal profitMargin) {
            this.profitMargin = profitMargin;
        }

        public int getActiveCustomers() {
            return activeCustomers;
        }

        public void setActiveCustomers(int activeCustomers) {
            this.activeCustomers = activeCustomers;
        }

        public BigDecimal getCustomerSatisfaction() {
            return customerSatisfaction;
        }

        public void setCustomerSatisfaction(BigDecimal customerSatisfaction) {
            this.customerSatisfaction = customerSatisfaction;
        }

        public String getPerformanceLevel() {
            return performanceLevel;
        }

        public void setPerformanceLevel(String performanceLevel) {
            this.performanceLevel = performanceLevel;
        }

        public Map<String, BigDecimal> getKpiScores() {
            return kpiScores;
        }

        public void setKpiScores(Map<String, BigDecimal> kpiScores) {
            this.kpiScores = kpiScores;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final StoreComparison obj = new StoreComparison();

            public Builder storeId(String storeId) {
                obj.storeId = storeId;
                return this;
            }

            public Builder storeName(String storeName) {
                obj.storeName = storeName;
                return this;
            }

            public Builder location(String location) {
                obj.location = location;
                return this;
            }

            public Builder rank(int rank) {
                obj.rank = rank;
                return this;
            }

            public Builder totalSales(BigDecimal totalSales) {
                obj.totalSales = totalSales;
                return this;
            }

            public Builder totalOrders(int totalOrders) {
                obj.totalOrders = totalOrders;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                obj.averageOrderValue = averageOrderValue;
                return this;
            }

            public Builder profitMargin(BigDecimal profitMargin) {
                obj.profitMargin = profitMargin;
                return this;
            }

            public Builder activeCustomers(int activeCustomers) {
                obj.activeCustomers = activeCustomers;
                return this;
            }

            public Builder customerSatisfaction(BigDecimal customerSatisfaction) {
                obj.customerSatisfaction = customerSatisfaction;
                return this;
            }

            public Builder performanceLevel(String performanceLevel) {
                obj.performanceLevel = performanceLevel;
                return this;
            }

            public Builder kpiScores(Map<String, BigDecimal> kpiScores) {
                obj.kpiScores = kpiScores;
                return this;
            }

            public StoreComparison build() {
                return obj;
            }
        }
    }

    public static class IndustryBenchmarks {
        private BigDecimal averageAOV; // INR - Industry average
        private BigDecimal averageProfitMargin; // Percentage
        private BigDecimal averageCustomerRetention; // Percentage
        private BigDecimal averageDeliveryTime; // Minutes
        private String dataSource;
        private String industrySegment; // "Fast Food", "Fine Dining", "Quick Service"

        public IndustryBenchmarks() {}

        public BigDecimal getAverageAOV() {
            return averageAOV;
        }

        public void setAverageAOV(BigDecimal averageAOV) {
            this.averageAOV = averageAOV;
        }

        public BigDecimal getAverageProfitMargin() {
            return averageProfitMargin;
        }

        public void setAverageProfitMargin(BigDecimal averageProfitMargin) {
            this.averageProfitMargin = averageProfitMargin;
        }

        public BigDecimal getAverageCustomerRetention() {
            return averageCustomerRetention;
        }

        public void setAverageCustomerRetention(BigDecimal averageCustomerRetention) {
            this.averageCustomerRetention = averageCustomerRetention;
        }

        public BigDecimal getAverageDeliveryTime() {
            return averageDeliveryTime;
        }

        public void setAverageDeliveryTime(BigDecimal averageDeliveryTime) {
            this.averageDeliveryTime = averageDeliveryTime;
        }

        public String getDataSource() {
            return dataSource;
        }

        public void setDataSource(String dataSource) {
            this.dataSource = dataSource;
        }

        public String getIndustrySegment() {
            return industrySegment;
        }

        public void setIndustrySegment(String industrySegment) {
            this.industrySegment = industrySegment;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final IndustryBenchmarks obj = new IndustryBenchmarks();

            public Builder averageAOV(BigDecimal averageAOV) {
                obj.averageAOV = averageAOV;
                return this;
            }

            public Builder averageProfitMargin(BigDecimal averageProfitMargin) {
                obj.averageProfitMargin = averageProfitMargin;
                return this;
            }

            public Builder averageCustomerRetention(BigDecimal averageCustomerRetention) {
                obj.averageCustomerRetention = averageCustomerRetention;
                return this;
            }

            public Builder averageDeliveryTime(BigDecimal averageDeliveryTime) {
                obj.averageDeliveryTime = averageDeliveryTime;
                return this;
            }

            public Builder dataSource(String dataSource) {
                obj.dataSource = dataSource;
                return this;
            }

            public Builder industrySegment(String industrySegment) {
                obj.industrySegment = industrySegment;
                return this;
            }

            public IndustryBenchmarks build() {
                return obj;
            }
        }
    }

    public static class KPIComparison {
        private String kpiName;
        private String unit;
        private BigDecimal yourValue;
        private BigDecimal networkAverage; // Average across all stores
        private BigDecimal industryAverage;
        private BigDecimal target;
        private String performance; // "Above Target", "On Target", "Below Target"
        private BigDecimal percentDifferenceFromTarget;

        public KPIComparison() {}

        public String getKpiName() {
            return kpiName;
        }

        public void setKpiName(String kpiName) {
            this.kpiName = kpiName;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public BigDecimal getYourValue() {
            return yourValue;
        }

        public void setYourValue(BigDecimal yourValue) {
            this.yourValue = yourValue;
        }

        public BigDecimal getNetworkAverage() {
            return networkAverage;
        }

        public void setNetworkAverage(BigDecimal networkAverage) {
            this.networkAverage = networkAverage;
        }

        public BigDecimal getIndustryAverage() {
            return industryAverage;
        }

        public void setIndustryAverage(BigDecimal industryAverage) {
            this.industryAverage = industryAverage;
        }

        public BigDecimal getTarget() {
            return target;
        }

        public void setTarget(BigDecimal target) {
            this.target = target;
        }

        public String getPerformance() {
            return performance;
        }

        public void setPerformance(String performance) {
            this.performance = performance;
        }

        public BigDecimal getPercentDifferenceFromTarget() {
            return percentDifferenceFromTarget;
        }

        public void setPercentDifferenceFromTarget(BigDecimal percentDifferenceFromTarget) {
            this.percentDifferenceFromTarget = percentDifferenceFromTarget;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final KPIComparison obj = new KPIComparison();

            public Builder kpiName(String kpiName) {
                obj.kpiName = kpiName;
                return this;
            }

            public Builder unit(String unit) {
                obj.unit = unit;
                return this;
            }

            public Builder yourValue(BigDecimal yourValue) {
                obj.yourValue = yourValue;
                return this;
            }

            public Builder networkAverage(BigDecimal networkAverage) {
                obj.networkAverage = networkAverage;
                return this;
            }

            public Builder industryAverage(BigDecimal industryAverage) {
                obj.industryAverage = industryAverage;
                return this;
            }

            public Builder target(BigDecimal target) {
                obj.target = target;
                return this;
            }

            public Builder performance(String performance) {
                obj.performance = performance;
                return this;
            }

            public Builder percentDifferenceFromTarget(BigDecimal percentDifferenceFromTarget) {
                obj.percentDifferenceFromTarget = percentDifferenceFromTarget;
                return this;
            }

            public KPIComparison build() {
                return obj;
            }
        }
    }

    public static class PerformanceInsight {
        private String insightType; // "Strength", "Weakness", "Opportunity", "Threat"
        private String title;
        private String description;
        private String recommendation;
        private BigDecimal priority; // 0-100

        public PerformanceInsight() {}

        public String getInsightType() {
            return insightType;
        }

        public void setInsightType(String insightType) {
            this.insightType = insightType;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getRecommendation() {
            return recommendation;
        }

        public void setRecommendation(String recommendation) {
            this.recommendation = recommendation;
        }

        public BigDecimal getPriority() {
            return priority;
        }

        public void setPriority(BigDecimal priority) {
            this.priority = priority;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final PerformanceInsight obj = new PerformanceInsight();

            public Builder insightType(String insightType) {
                obj.insightType = insightType;
                return this;
            }

            public Builder title(String title) {
                obj.title = title;
                return this;
            }

            public Builder description(String description) {
                obj.description = description;
                return this;
            }

            public Builder recommendation(String recommendation) {
                obj.recommendation = recommendation;
                return this;
            }

            public Builder priority(BigDecimal priority) {
                obj.priority = priority;
                return this;
            }

            public PerformanceInsight build() {
                return obj;
            }
        }
    }
}
