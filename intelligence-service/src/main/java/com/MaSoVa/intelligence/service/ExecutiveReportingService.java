package com.MaSoVa.intelligence.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.ExecutiveSummaryResponse;
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
public class ExecutiveReportingService {

    private static final Logger log = LoggerFactory.getLogger(ExecutiveReportingService.class);

    private final OrderServiceClient orderServiceClient;

    public ExecutiveReportingService(OrderServiceClient orderServiceClient) {
        this.orderServiceClient = orderServiceClient;
    }

    /**
     * Generate comprehensive executive summary report
     */
    @Cacheable(value = "executiveSummary", key = "#p0")
    public ExecutiveSummaryResponse generateExecutiveSummary(String period) {
        log.info("Generating executive summary for period: {}", period);

        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate prevStartDate;

        switch (period.toUpperCase()) {
            case "YEAR":
                startDate = today.minusYears(1).plusDays(1);
                prevStartDate = startDate.minusYears(1);
                break;
            case "QUARTER":
                startDate = today.minusDays(89);
                prevStartDate = startDate.minusDays(90);
                break;
            case "MONTH":
                startDate = today.minusDays(29);
                prevStartDate = startDate.minusDays(30);
                break;
            default: // WEEK
                startDate = today.minusDays(6);
                prevStartDate = startDate.minusDays(7);
        }

        // Get current and previous period orders
        List<Map<String, Object>> currentOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        List<Map<String, Object>> previousOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(prevStartDate, LocalTime.MIN),
            LocalDateTime.of(startDate.minusDays(1), LocalTime.MAX)
        );

        // Financial Summary
        ExecutiveSummaryResponse.FinancialSummary financialSummary = generateFinancialSummary(currentOrders);

        // Operational Metrics
        ExecutiveSummaryResponse.OperationalMetrics operationalMetrics = generateOperationalMetrics(currentOrders);

        // KPI Tiles
        List<ExecutiveSummaryResponse.KPITile> kpiTiles = generateKPITiles(currentOrders, previousOrders);

        // Growth Metrics
        ExecutiveSummaryResponse.GrowthMetrics growthMetrics = generateGrowthMetrics(currentOrders, previousOrders);

        // Top Performers
        List<ExecutiveSummaryResponse.TopPerformer> topPerformers = generateTopPerformers(currentOrders);

        // Actionable Insights
        List<ExecutiveSummaryResponse.ActionableInsight> insights = generateActionableInsights(
            financialSummary, operationalMetrics, growthMetrics
        );

        return ExecutiveSummaryResponse.builder()
                .reportPeriod(period.toUpperCase())
                .startDate(startDate)
                .endDate(today)
                .financialSummary(financialSummary)
                .operationalMetrics(operationalMetrics)
                .kpiTiles(kpiTiles)
                .growthMetrics(growthMetrics)
                .topPerformers(topPerformers)
                .insights(insights)
                .build();
    }

    private ExecutiveSummaryResponse.FinancialSummary generateFinancialSummary(List<Map<String, Object>> orders) {
        BigDecimal totalRevenue = orders.stream()
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cost estimates (60% of revenue for food costs)
        BigDecimal totalCosts = totalRevenue.multiply(BigDecimal.valueOf(0.60));
        BigDecimal grossProfit = totalRevenue.subtract(totalCosts);

        // Operating expenses (25% of revenue)
        BigDecimal operatingExpenses = totalRevenue.multiply(BigDecimal.valueOf(0.25));
        BigDecimal netProfit = grossProfit.subtract(operatingExpenses);

        BigDecimal grossProfitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
            ? grossProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        BigDecimal netProfitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
            ? netProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        // EBITDA (simplified)
        BigDecimal ebitda = netProfit.add(operatingExpenses.multiply(BigDecimal.valueOf(0.3)));

        // ROI (simplified - assuming 100% of revenue as investment)
        BigDecimal roi = totalRevenue.compareTo(BigDecimal.ZERO) > 0
            ? netProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        // Revenue by channel
        Map<String, BigDecimal> revenueByChannel = new HashMap<>();
        Map<String, List<Map<String, Object>>> ordersByType = orders.stream()
            .collect(Collectors.groupingBy(o -> (String) o.getOrDefault("orderType", "DINE_IN")));

        for (Map.Entry<String, List<Map<String, Object>>> entry : ordersByType.entrySet()) {
            BigDecimal channelRevenue = entry.getValue().stream()
                .map(this::getOrderAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            revenueByChannel.put(entry.getKey(), channelRevenue);
        }

        return ExecutiveSummaryResponse.FinancialSummary.builder()
                .totalRevenue(totalRevenue)
                .totalCosts(totalCosts)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .grossProfitMargin(grossProfitMargin)
                .netProfitMargin(netProfitMargin)
                .operatingExpenses(operatingExpenses)
                .ebitda(ebitda)
                .roi(roi)
                .revenueByChannel(revenueByChannel)
                .build();
    }

    private ExecutiveSummaryResponse.OperationalMetrics generateOperationalMetrics(List<Map<String, Object>> orders) {
        int totalOrders = orders.size();

        BigDecimal totalRevenue = orders.stream()
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgOrderValue = totalOrders > 0
            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Customer metrics
        Set<String> uniqueCustomers = orders.stream()
            .map(o -> (String) o.get("customerId"))
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        int totalCustomers = uniqueCustomers.size();

        // Mock other metrics
        int newCustomers = (int) (totalCustomers * 0.2); // 20% are new
        int activeCustomers = totalCustomers;
        BigDecimal retentionRate = BigDecimal.valueOf(80.0);
        BigDecimal avgDeliveryTime = BigDecimal.valueOf(32.5);
        BigDecimal orderAccuracyRate = BigDecimal.valueOf(96.5);
        int totalMenuItems = 45;
        int totalStaff = 25;

        return ExecutiveSummaryResponse.OperationalMetrics.builder()
                .totalOrders(totalOrders)
                .averageOrderValue(avgOrderValue)
                .totalCustomers(totalCustomers)
                .newCustomers(newCustomers)
                .activeCustomers(activeCustomers)
                .customerRetentionRate(retentionRate)
                .averageDeliveryTime(avgDeliveryTime)
                .orderAccuracyRate(orderAccuracyRate)
                .totalMenuItems(totalMenuItems)
                .totalStaff(totalStaff)
                .build();
    }

    private List<ExecutiveSummaryResponse.KPITile> generateKPITiles(
        List<Map<String, Object>> currentOrders,
        List<Map<String, Object>> previousOrders
    ) {
        List<ExecutiveSummaryResponse.KPITile> tiles = new ArrayList<>();

        // Revenue KPI
        BigDecimal currentRevenue = currentOrders.stream().map(this::getOrderAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal previousRevenue = previousOrders.stream().map(this::getOrderAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal revenueChange = calculatePercentChange(currentRevenue, previousRevenue);

        tiles.add(createKPITile(
            "Total Revenue", "Financial", currentRevenue, previousRevenue, revenueChange,
            "INR", currentRevenue.multiply(BigDecimal.valueOf(1.1))
        ));

        // Orders KPI
        BigDecimal currentOrderCount = BigDecimal.valueOf(currentOrders.size());
        BigDecimal previousOrderCount = BigDecimal.valueOf(previousOrders.size());
        BigDecimal ordersChange = calculatePercentChange(currentOrderCount, previousOrderCount);

        tiles.add(createKPITile(
            "Total Orders", "Operational", currentOrderCount, previousOrderCount, ordersChange,
            "#", BigDecimal.valueOf(currentOrders.size() * 1.15)
        ));

        // AOV KPI
        BigDecimal currentAOV = currentOrders.size() > 0
            ? currentRevenue.divide(BigDecimal.valueOf(currentOrders.size()), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal previousAOV = previousOrders.size() > 0
            ? previousRevenue.divide(BigDecimal.valueOf(previousOrders.size()), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal aovChange = calculatePercentChange(currentAOV, previousAOV);

        tiles.add(createKPITile(
            "Average Order Value", "Financial", currentAOV, previousAOV, aovChange,
            "INR", BigDecimal.valueOf(400)
        ));

        // Customer Satisfaction KPI
        BigDecimal currentSatisfaction = BigDecimal.valueOf(4.3);
        BigDecimal previousSatisfaction = BigDecimal.valueOf(4.1);
        BigDecimal satisfactionChange = calculatePercentChange(currentSatisfaction, previousSatisfaction);

        tiles.add(createKPITile(
            "Customer Satisfaction", "Customer", currentSatisfaction, previousSatisfaction, satisfactionChange,
            "out of 5", BigDecimal.valueOf(4.5)
        ));

        return tiles;
    }

    private ExecutiveSummaryResponse.KPITile createKPITile(
        String name, String category, BigDecimal current, BigDecimal previous,
        BigDecimal percentChange, String unit, BigDecimal target
    ) {
        String trend = percentChange.compareTo(BigDecimal.ZERO) > 0 ? "UP" :
                       percentChange.compareTo(BigDecimal.ZERO) < 0 ? "DOWN" : "STABLE";

        String status = current.compareTo(target) >= 0 ? "Excellent" :
                        current.compareTo(target.multiply(BigDecimal.valueOf(0.9))) >= 0 ? "Good" :
                        current.compareTo(target.multiply(BigDecimal.valueOf(0.75))) >= 0 ? "Warning" : "Critical";

        return ExecutiveSummaryResponse.KPITile.builder()
                .kpiName(name)
                .category(category)
                .currentValue(current)
                .unit(unit)
                .previousValue(previous)
                .percentChange(percentChange)
                .trend(trend)
                .status(status)
                .target(target)
                .build();
    }

    private ExecutiveSummaryResponse.GrowthMetrics generateGrowthMetrics(
        List<Map<String, Object>> currentOrders,
        List<Map<String, Object>> previousOrders
    ) {
        BigDecimal currentRevenue = currentOrders.stream().map(this::getOrderAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal previousRevenue = previousOrders.stream().map(this::getOrderAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueGrowth = calculatePercentChange(currentRevenue, previousRevenue);
        BigDecimal orderGrowth = calculatePercentChange(
            BigDecimal.valueOf(currentOrders.size()),
            BigDecimal.valueOf(previousOrders.size())
        );
        BigDecimal customerGrowth = BigDecimal.valueOf(12.5); // Mock
        BigDecimal profitGrowth = BigDecimal.valueOf(15.3); // Mock
        BigDecimal marketShareGrowth = BigDecimal.valueOf(2.1); // Mock

        // Projected annual revenue
        BigDecimal weeklyRevenue = currentRevenue;
        String projectedAnnual = "₹" + weeklyRevenue.multiply(BigDecimal.valueOf(52))
            .setScale(0, RoundingMode.HALF_UP).toString();

        List<ExecutiveSummaryResponse.GrowthDriver> drivers = Arrays.asList(
            ExecutiveSummaryResponse.GrowthDriver.builder()
                .driverName("Delivery Channel Expansion")
                .description("45% increase in delivery orders")
                .contribution(BigDecimal.valueOf(35))
                .build(),
            ExecutiveSummaryResponse.GrowthDriver.builder()
                .driverName("New Menu Items")
                .description("5 new premium items launched")
                .contribution(BigDecimal.valueOf(25))
                .build(),
            ExecutiveSummaryResponse.GrowthDriver.builder()
                .driverName("Customer Retention Programs")
                .description("Loyalty program driving repeat orders")
                .contribution(BigDecimal.valueOf(20))
                .build()
        );

        return ExecutiveSummaryResponse.GrowthMetrics.builder()
                .revenueGrowthRate(revenueGrowth)
                .customerGrowthRate(customerGrowth)
                .orderGrowthRate(orderGrowth)
                .profitGrowthRate(profitGrowth)
                .marketShareGrowth(marketShareGrowth)
                .projectedAnnualRevenue(projectedAnnual)
                .topDrivers(drivers)
                .build();
    }

    private List<ExecutiveSummaryResponse.TopPerformer> generateTopPerformers(List<Map<String, Object>> orders) {
        List<ExecutiveSummaryResponse.TopPerformer> performers = new ArrayList<>();

        // Top product by sales
        Map<String, BigDecimal> productSales = new HashMap<>();
        for (Map<String, Object> order : orders) {
            Object itemsObj = order.get("items");
            if (itemsObj instanceof List<?> itemsList) {
                for (Object itemObj : itemsList) {
                    if (!(itemObj instanceof Map<?, ?>)) continue;
                    Map<?, ?> itemMap = (Map<?, ?>) itemObj;
                    String itemName = (String) itemMap.get("itemName");
                    Object priceObj = itemMap.get("price");
                    BigDecimal price = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue()) : BigDecimal.ZERO;
                    Object qtyObj = itemMap.get("quantity");
                    int qty = qtyObj instanceof Number ? ((Number) qtyObj).intValue() : 0;
                    productSales.merge(itemName, price.multiply(BigDecimal.valueOf(qty)), BigDecimal::add);
                }
            }
        }

        productSales.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .ifPresent(entry -> performers.add(ExecutiveSummaryResponse.TopPerformer.builder()
                .category("Product")
                .name(entry.getKey())
                .id("PROD001")
                .value(entry.getValue())
                .metric("Sales")
                .rank(1)
                .build()));

        // TODO: Add real store performance data from order analytics
        // Removed hardcoded STORE001 mock data

        return performers;
    }

    private List<ExecutiveSummaryResponse.ActionableInsight> generateActionableInsights(
        ExecutiveSummaryResponse.FinancialSummary financialSummary,
        ExecutiveSummaryResponse.OperationalMetrics operationalMetrics,
        ExecutiveSummaryResponse.GrowthMetrics growthMetrics
    ) {
        List<ExecutiveSummaryResponse.ActionableInsight> insights = new ArrayList<>();

        // High priority insight
        insights.add(ExecutiveSummaryResponse.ActionableInsight.builder()
            .priority("HIGH")
            .category("Revenue")
            .title("Capitalize on Delivery Growth")
            .description("Delivery channel showing 45% growth")
            .recommendation("Expand delivery radius and add more delivery partners")
            .potentialImpact(BigDecimal.valueOf(50000))
            .impactType("Revenue Increase")
            .build());

        // Medium priority insight
        insights.add(ExecutiveSummaryResponse.ActionableInsight.builder()
            .priority("MEDIUM")
            .category("Cost")
            .title("Optimize Ingredient Procurement")
            .description("Food costs are at 60% of revenue")
            .recommendation("Negotiate better supplier rates and reduce waste")
            .potentialImpact(BigDecimal.valueOf(15))
            .impactType("Cost Reduction")
            .build());

        // Customer insight
        insights.add(ExecutiveSummaryResponse.ActionableInsight.builder()
            .priority("MEDIUM")
            .category("Customer")
            .title("Improve Customer Retention")
            .description("Retention rate at 80%, industry average is 85%")
            .recommendation("Launch targeted loyalty programs and personalized offers")
            .potentialImpact(BigDecimal.valueOf(25000))
            .impactType("Revenue Increase")
            .build());

        return insights;
    }

    private BigDecimal calculatePercentChange(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return current.subtract(previous)
            .divide(previous, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal getOrderAmount(Map<String, Object> order) {
        Object totalAmount = order.get("totalAmount");
        if (totalAmount instanceof Number) {
            return BigDecimal.valueOf(((Number) totalAmount).doubleValue());
        }
        return BigDecimal.ZERO;
    }
}
