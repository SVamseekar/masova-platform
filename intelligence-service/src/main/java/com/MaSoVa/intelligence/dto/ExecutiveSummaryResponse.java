package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class ExecutiveSummaryResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String reportPeriod; // "WEEK", "MONTH", "QUARTER", "YEAR"
    private LocalDate startDate;
    private LocalDate endDate;
    private FinancialSummary financialSummary;
    private OperationalMetrics operationalMetrics;
    private List<KPITile> kpiTiles;
    private GrowthMetrics growthMetrics;
    private List<TopPerformer> topPerformers;
    private List<ActionableInsight> insights;

    public ExecutiveSummaryResponse() {}

    public String getReportPeriod() {
        return reportPeriod;
    }

    public void setReportPeriod(String reportPeriod) {
        this.reportPeriod = reportPeriod;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public FinancialSummary getFinancialSummary() {
        return financialSummary;
    }

    public void setFinancialSummary(FinancialSummary financialSummary) {
        this.financialSummary = financialSummary;
    }

    public OperationalMetrics getOperationalMetrics() {
        return operationalMetrics;
    }

    public void setOperationalMetrics(OperationalMetrics operationalMetrics) {
        this.operationalMetrics = operationalMetrics;
    }

    public List<KPITile> getKpiTiles() {
        return kpiTiles;
    }

    public void setKpiTiles(List<KPITile> kpiTiles) {
        this.kpiTiles = kpiTiles;
    }

    public GrowthMetrics getGrowthMetrics() {
        return growthMetrics;
    }

    public void setGrowthMetrics(GrowthMetrics growthMetrics) {
        this.growthMetrics = growthMetrics;
    }

    public List<TopPerformer> getTopPerformers() {
        return topPerformers;
    }

    public void setTopPerformers(List<TopPerformer> topPerformers) {
        this.topPerformers = topPerformers;
    }

    public List<ActionableInsight> getInsights() {
        return insights;
    }

    public void setInsights(List<ActionableInsight> insights) {
        this.insights = insights;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ExecutiveSummaryResponse obj = new ExecutiveSummaryResponse();

        public Builder reportPeriod(String reportPeriod) {
            obj.reportPeriod = reportPeriod;
            return this;
        }

        public Builder startDate(LocalDate startDate) {
            obj.startDate = startDate;
            return this;
        }

        public Builder endDate(LocalDate endDate) {
            obj.endDate = endDate;
            return this;
        }

        public Builder financialSummary(FinancialSummary financialSummary) {
            obj.financialSummary = financialSummary;
            return this;
        }

        public Builder operationalMetrics(OperationalMetrics operationalMetrics) {
            obj.operationalMetrics = operationalMetrics;
            return this;
        }

        public Builder kpiTiles(List<KPITile> kpiTiles) {
            obj.kpiTiles = kpiTiles;
            return this;
        }

        public Builder growthMetrics(GrowthMetrics growthMetrics) {
            obj.growthMetrics = growthMetrics;
            return this;
        }

        public Builder topPerformers(List<TopPerformer> topPerformers) {
            obj.topPerformers = topPerformers;
            return this;
        }

        public Builder insights(List<ActionableInsight> insights) {
            obj.insights = insights;
            return this;
        }

        public ExecutiveSummaryResponse build() {
            return obj;
        }
    }

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

        public FinancialSummary() {}

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }

        public BigDecimal getTotalCosts() {
            return totalCosts;
        }

        public void setTotalCosts(BigDecimal totalCosts) {
            this.totalCosts = totalCosts;
        }

        public BigDecimal getGrossProfit() {
            return grossProfit;
        }

        public void setGrossProfit(BigDecimal grossProfit) {
            this.grossProfit = grossProfit;
        }

        public BigDecimal getNetProfit() {
            return netProfit;
        }

        public void setNetProfit(BigDecimal netProfit) {
            this.netProfit = netProfit;
        }

        public BigDecimal getGrossProfitMargin() {
            return grossProfitMargin;
        }

        public void setGrossProfitMargin(BigDecimal grossProfitMargin) {
            this.grossProfitMargin = grossProfitMargin;
        }

        public BigDecimal getNetProfitMargin() {
            return netProfitMargin;
        }

        public void setNetProfitMargin(BigDecimal netProfitMargin) {
            this.netProfitMargin = netProfitMargin;
        }

        public BigDecimal getOperatingExpenses() {
            return operatingExpenses;
        }

        public void setOperatingExpenses(BigDecimal operatingExpenses) {
            this.operatingExpenses = operatingExpenses;
        }

        public BigDecimal getEbitda() {
            return ebitda;
        }

        public void setEbitda(BigDecimal ebitda) {
            this.ebitda = ebitda;
        }

        public BigDecimal getRoi() {
            return roi;
        }

        public void setRoi(BigDecimal roi) {
            this.roi = roi;
        }

        public Map<String, BigDecimal> getRevenueByChannel() {
            return revenueByChannel;
        }

        public void setRevenueByChannel(Map<String, BigDecimal> revenueByChannel) {
            this.revenueByChannel = revenueByChannel;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final FinancialSummary obj = new FinancialSummary();

            public Builder totalRevenue(BigDecimal totalRevenue) {
                obj.totalRevenue = totalRevenue;
                return this;
            }

            public Builder totalCosts(BigDecimal totalCosts) {
                obj.totalCosts = totalCosts;
                return this;
            }

            public Builder grossProfit(BigDecimal grossProfit) {
                obj.grossProfit = grossProfit;
                return this;
            }

            public Builder netProfit(BigDecimal netProfit) {
                obj.netProfit = netProfit;
                return this;
            }

            public Builder grossProfitMargin(BigDecimal grossProfitMargin) {
                obj.grossProfitMargin = grossProfitMargin;
                return this;
            }

            public Builder netProfitMargin(BigDecimal netProfitMargin) {
                obj.netProfitMargin = netProfitMargin;
                return this;
            }

            public Builder operatingExpenses(BigDecimal operatingExpenses) {
                obj.operatingExpenses = operatingExpenses;
                return this;
            }

            public Builder ebitda(BigDecimal ebitda) {
                obj.ebitda = ebitda;
                return this;
            }

            public Builder roi(BigDecimal roi) {
                obj.roi = roi;
                return this;
            }

            public Builder revenueByChannel(Map<String, BigDecimal> revenueByChannel) {
                obj.revenueByChannel = revenueByChannel;
                return this;
            }

            public FinancialSummary build() {
                return obj;
            }
        }
    }

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

        public OperationalMetrics() {}

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

        public int getTotalCustomers() {
            return totalCustomers;
        }

        public void setTotalCustomers(int totalCustomers) {
            this.totalCustomers = totalCustomers;
        }

        public int getNewCustomers() {
            return newCustomers;
        }

        public void setNewCustomers(int newCustomers) {
            this.newCustomers = newCustomers;
        }

        public int getActiveCustomers() {
            return activeCustomers;
        }

        public void setActiveCustomers(int activeCustomers) {
            this.activeCustomers = activeCustomers;
        }

        public BigDecimal getCustomerRetentionRate() {
            return customerRetentionRate;
        }

        public void setCustomerRetentionRate(BigDecimal customerRetentionRate) {
            this.customerRetentionRate = customerRetentionRate;
        }

        public BigDecimal getAverageDeliveryTime() {
            return averageDeliveryTime;
        }

        public void setAverageDeliveryTime(BigDecimal averageDeliveryTime) {
            this.averageDeliveryTime = averageDeliveryTime;
        }

        public BigDecimal getOrderAccuracyRate() {
            return orderAccuracyRate;
        }

        public void setOrderAccuracyRate(BigDecimal orderAccuracyRate) {
            this.orderAccuracyRate = orderAccuracyRate;
        }

        public int getTotalMenuItems() {
            return totalMenuItems;
        }

        public void setTotalMenuItems(int totalMenuItems) {
            this.totalMenuItems = totalMenuItems;
        }

        public int getTotalStaff() {
            return totalStaff;
        }

        public void setTotalStaff(int totalStaff) {
            this.totalStaff = totalStaff;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final OperationalMetrics obj = new OperationalMetrics();

            public Builder totalOrders(int totalOrders) {
                obj.totalOrders = totalOrders;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                obj.averageOrderValue = averageOrderValue;
                return this;
            }

            public Builder totalCustomers(int totalCustomers) {
                obj.totalCustomers = totalCustomers;
                return this;
            }

            public Builder newCustomers(int newCustomers) {
                obj.newCustomers = newCustomers;
                return this;
            }

            public Builder activeCustomers(int activeCustomers) {
                obj.activeCustomers = activeCustomers;
                return this;
            }

            public Builder customerRetentionRate(BigDecimal customerRetentionRate) {
                obj.customerRetentionRate = customerRetentionRate;
                return this;
            }

            public Builder averageDeliveryTime(BigDecimal averageDeliveryTime) {
                obj.averageDeliveryTime = averageDeliveryTime;
                return this;
            }

            public Builder orderAccuracyRate(BigDecimal orderAccuracyRate) {
                obj.orderAccuracyRate = orderAccuracyRate;
                return this;
            }

            public Builder totalMenuItems(int totalMenuItems) {
                obj.totalMenuItems = totalMenuItems;
                return this;
            }

            public Builder totalStaff(int totalStaff) {
                obj.totalStaff = totalStaff;
                return this;
            }

            public OperationalMetrics build() {
                return obj;
            }
        }
    }

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

        public KPITile() {}

        public String getKpiName() {
            return kpiName;
        }

        public void setKpiName(String kpiName) {
            this.kpiName = kpiName;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public BigDecimal getCurrentValue() {
            return currentValue;
        }

        public void setCurrentValue(BigDecimal currentValue) {
            this.currentValue = currentValue;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public BigDecimal getPreviousValue() {
            return previousValue;
        }

        public void setPreviousValue(BigDecimal previousValue) {
            this.previousValue = previousValue;
        }

        public BigDecimal getPercentChange() {
            return percentChange;
        }

        public void setPercentChange(BigDecimal percentChange) {
            this.percentChange = percentChange;
        }

        public String getTrend() {
            return trend;
        }

        public void setTrend(String trend) {
            this.trend = trend;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public BigDecimal getTarget() {
            return target;
        }

        public void setTarget(BigDecimal target) {
            this.target = target;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final KPITile obj = new KPITile();

            public Builder kpiName(String kpiName) {
                obj.kpiName = kpiName;
                return this;
            }

            public Builder category(String category) {
                obj.category = category;
                return this;
            }

            public Builder currentValue(BigDecimal currentValue) {
                obj.currentValue = currentValue;
                return this;
            }

            public Builder unit(String unit) {
                obj.unit = unit;
                return this;
            }

            public Builder previousValue(BigDecimal previousValue) {
                obj.previousValue = previousValue;
                return this;
            }

            public Builder percentChange(BigDecimal percentChange) {
                obj.percentChange = percentChange;
                return this;
            }

            public Builder trend(String trend) {
                obj.trend = trend;
                return this;
            }

            public Builder status(String status) {
                obj.status = status;
                return this;
            }

            public Builder target(BigDecimal target) {
                obj.target = target;
                return this;
            }

            public KPITile build() {
                return obj;
            }
        }
    }

    public static class GrowthMetrics {
        private BigDecimal revenueGrowthRate; // Percentage
        private BigDecimal customerGrowthRate; // Percentage
        private BigDecimal orderGrowthRate; // Percentage
        private BigDecimal profitGrowthRate; // Percentage
        private BigDecimal marketShareGrowth; // Percentage (if applicable)
        private String projectedAnnualRevenue; // INR - Based on current growth
        private List<GrowthDriver> topDrivers;

        public GrowthMetrics() {}

        public BigDecimal getRevenueGrowthRate() {
            return revenueGrowthRate;
        }

        public void setRevenueGrowthRate(BigDecimal revenueGrowthRate) {
            this.revenueGrowthRate = revenueGrowthRate;
        }

        public BigDecimal getCustomerGrowthRate() {
            return customerGrowthRate;
        }

        public void setCustomerGrowthRate(BigDecimal customerGrowthRate) {
            this.customerGrowthRate = customerGrowthRate;
        }

        public BigDecimal getOrderGrowthRate() {
            return orderGrowthRate;
        }

        public void setOrderGrowthRate(BigDecimal orderGrowthRate) {
            this.orderGrowthRate = orderGrowthRate;
        }

        public BigDecimal getProfitGrowthRate() {
            return profitGrowthRate;
        }

        public void setProfitGrowthRate(BigDecimal profitGrowthRate) {
            this.profitGrowthRate = profitGrowthRate;
        }

        public BigDecimal getMarketShareGrowth() {
            return marketShareGrowth;
        }

        public void setMarketShareGrowth(BigDecimal marketShareGrowth) {
            this.marketShareGrowth = marketShareGrowth;
        }

        public String getProjectedAnnualRevenue() {
            return projectedAnnualRevenue;
        }

        public void setProjectedAnnualRevenue(String projectedAnnualRevenue) {
            this.projectedAnnualRevenue = projectedAnnualRevenue;
        }

        public List<GrowthDriver> getTopDrivers() {
            return topDrivers;
        }

        public void setTopDrivers(List<GrowthDriver> topDrivers) {
            this.topDrivers = topDrivers;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final GrowthMetrics obj = new GrowthMetrics();

            public Builder revenueGrowthRate(BigDecimal revenueGrowthRate) {
                obj.revenueGrowthRate = revenueGrowthRate;
                return this;
            }

            public Builder customerGrowthRate(BigDecimal customerGrowthRate) {
                obj.customerGrowthRate = customerGrowthRate;
                return this;
            }

            public Builder orderGrowthRate(BigDecimal orderGrowthRate) {
                obj.orderGrowthRate = orderGrowthRate;
                return this;
            }

            public Builder profitGrowthRate(BigDecimal profitGrowthRate) {
                obj.profitGrowthRate = profitGrowthRate;
                return this;
            }

            public Builder marketShareGrowth(BigDecimal marketShareGrowth) {
                obj.marketShareGrowth = marketShareGrowth;
                return this;
            }

            public Builder projectedAnnualRevenue(String projectedAnnualRevenue) {
                obj.projectedAnnualRevenue = projectedAnnualRevenue;
                return this;
            }

            public Builder topDrivers(List<GrowthDriver> topDrivers) {
                obj.topDrivers = topDrivers;
                return this;
            }

            public GrowthMetrics build() {
                return obj;
            }
        }
    }

    public static class GrowthDriver {
        private String driverName;
        private String description;
        private BigDecimal contribution; // Percentage of total growth

        public GrowthDriver() {}

        public String getDriverName() {
            return driverName;
        }

        public void setDriverName(String driverName) {
            this.driverName = driverName;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public BigDecimal getContribution() {
            return contribution;
        }

        public void setContribution(BigDecimal contribution) {
            this.contribution = contribution;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final GrowthDriver obj = new GrowthDriver();

            public Builder driverName(String driverName) {
                obj.driverName = driverName;
                return this;
            }

            public Builder description(String description) {
                obj.description = description;
                return this;
            }

            public Builder contribution(BigDecimal contribution) {
                obj.contribution = contribution;
                return this;
            }

            public GrowthDriver build() {
                return obj;
            }
        }
    }

    public static class TopPerformer {
        private String category; // "Store", "Staff", "Product", "Customer"
        private String name;
        private String id;
        private BigDecimal value;
        private String metric; // "Sales", "Orders", "Rating"
        private int rank;

        public TopPerformer() {}

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public BigDecimal getValue() {
            return value;
        }

        public void setValue(BigDecimal value) {
            this.value = value;
        }

        public String getMetric() {
            return metric;
        }

        public void setMetric(String metric) {
            this.metric = metric;
        }

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
            this.rank = rank;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final TopPerformer obj = new TopPerformer();

            public Builder category(String category) {
                obj.category = category;
                return this;
            }

            public Builder name(String name) {
                obj.name = name;
                return this;
            }

            public Builder id(String id) {
                obj.id = id;
                return this;
            }

            public Builder value(BigDecimal value) {
                obj.value = value;
                return this;
            }

            public Builder metric(String metric) {
                obj.metric = metric;
                return this;
            }

            public Builder rank(int rank) {
                obj.rank = rank;
                return this;
            }

            public TopPerformer build() {
                return obj;
            }
        }
    }

    public static class ActionableInsight {
        private String priority; // "HIGH", "MEDIUM", "LOW"
        private String category; // "Revenue", "Cost", "Customer", "Operations"
        private String title;
        private String description;
        private String recommendation;
        private BigDecimal potentialImpact; // INR or percentage
        private String impactType; // "Revenue Increase", "Cost Reduction", "Efficiency Gain"

        public ActionableInsight() {}

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
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

        public BigDecimal getPotentialImpact() {
            return potentialImpact;
        }

        public void setPotentialImpact(BigDecimal potentialImpact) {
            this.potentialImpact = potentialImpact;
        }

        public String getImpactType() {
            return impactType;
        }

        public void setImpactType(String impactType) {
            this.impactType = impactType;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final ActionableInsight obj = new ActionableInsight();

            public Builder priority(String priority) {
                obj.priority = priority;
                return this;
            }

            public Builder category(String category) {
                obj.category = category;
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

            public Builder potentialImpact(BigDecimal potentialImpact) {
                obj.potentialImpact = potentialImpact;
                return this;
            }

            public Builder impactType(String impactType) {
                obj.impactType = impactType;
                return this;
            }

            public ActionableInsight build() {
                return obj;
            }
        }
    }
}
