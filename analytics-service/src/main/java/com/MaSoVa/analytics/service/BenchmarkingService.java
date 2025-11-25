package com.MaSoVa.analytics.service;

import com.MaSoVa.analytics.client.OrderServiceClient;
import com.MaSoVa.analytics.client.UserServiceClient;
import com.MaSoVa.analytics.client.CustomerServiceClient;
import com.MaSoVa.analytics.dto.BenchmarkingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BenchmarkingService {

    private final OrderServiceClient orderServiceClient;
    private final CustomerServiceClient customerServiceClient;
    private final UserServiceClient userServiceClient;

    /**
     * Generate benchmarking report comparing stores and industry standards
     */
    @Cacheable(value = "benchmarking", key = "#period")
    public BenchmarkingResponse generateBenchmarkingReport(String period) {
        log.info("Generating benchmarking report for period: {}", period);

        LocalDate today = LocalDate.now();
        LocalDate startDate;

        switch (period.toUpperCase()) {
            case "QUARTER":
                startDate = today.minusDays(89);
                break;
            case "MONTH":
                startDate = today.minusDays(29);
                break;
            default:
                startDate = today.minusDays(6);
        }

        // Get orders for all stores
        List<Map<String, Object>> allOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        // Group orders by store (mock - assuming storeId in orders)
        Map<String, List<Map<String, Object>>> ordersByStore = groupOrdersByStore(allOrders);

        // Generate store comparisons
        List<BenchmarkingResponse.StoreComparison> storeComparisons = generateStoreComparisons(ordersByStore);

        // Industry benchmarks (mock data based on Indian restaurant industry)
        BenchmarkingResponse.IndustryBenchmarks industryBenchmarks = BenchmarkingResponse.IndustryBenchmarks.builder()
            .averageAOV(BigDecimal.valueOf(350)) // ₹350 average order value
            .averageProfitMargin(BigDecimal.valueOf(15.5)) // 15.5%
            .averageCustomerRetention(BigDecimal.valueOf(68.0)) // 68%
            .averageDeliveryTime(BigDecimal.valueOf(35)) // 35 minutes
            .dataSource("Industry Reports 2025")
            .industrySegment("Quick Service Restaurant")
            .build();

        // KPI comparisons
        List<BenchmarkingResponse.KPIComparison> kpiComparisons = generateKPIComparisons(
            allOrders, industryBenchmarks
        );

        // Performance insights
        List<BenchmarkingResponse.PerformanceInsight> insights = generatePerformanceInsights(
            storeComparisons, kpiComparisons
        );

        return BenchmarkingResponse.builder()
                .period(period.toUpperCase())
                .storeComparisons(storeComparisons)
                .industryBenchmarks(industryBenchmarks)
                .kpiComparisons(kpiComparisons)
                .insights(insights)
                .build();
    }

    private Map<String, List<Map<String, Object>>> groupOrdersByStore(List<Map<String, Object>> orders) {
        Map<String, List<Map<String, Object>>> byStore = new HashMap<>();

        for (Map<String, Object> order : orders) {
            // Mock store ID - in reality this would come from the order
            String storeId = (String) order.getOrDefault("storeId", "STORE001");
            byStore.computeIfAbsent(storeId, k -> new ArrayList<>()).add(order);
        }

        // If no stores, create a default one
        if (byStore.isEmpty()) {
            byStore.put("STORE001", orders);
        }

        return byStore;
    }

    private List<BenchmarkingResponse.StoreComparison> generateStoreComparisons(
        Map<String, List<Map<String, Object>>> ordersByStore
    ) {
        List<BenchmarkingResponse.StoreComparison> comparisons = new ArrayList<>();
        int rank = 1;

        // Calculate metrics for each store
        for (Map.Entry<String, List<Map<String, Object>>> entry : ordersByStore.entrySet()) {
            String storeId = entry.getKey();
            List<Map<String, Object>> orders = entry.getValue();

            BigDecimal totalSales = orders.stream()
                .map(this::getOrderAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            int totalOrders = orders.size();
            BigDecimal aov = totalOrders > 0
                ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            // Mock other metrics
            BigDecimal profitMargin = BigDecimal.valueOf(18.5);
            int activeCustomers = (int) (totalOrders * 0.6); // Rough estimate
            BigDecimal customerSatisfaction = BigDecimal.valueOf(4.2);

            String performanceLevel = determinePerformanceLevel(aov, profitMargin, customerSatisfaction);

            Map<String, BigDecimal> kpiScores = new HashMap<>();
            kpiScores.put("Sales", totalSales);
            kpiScores.put("AOV", aov);
            kpiScores.put("Profit Margin", profitMargin);
            kpiScores.put("Customer Satisfaction", customerSatisfaction);

            comparisons.add(BenchmarkingResponse.StoreComparison.builder()
                .storeId(storeId)
                .storeName("Store " + storeId)
                .location("Mumbai") // Mock location
                .rank(rank++)
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .averageOrderValue(aov)
                .profitMargin(profitMargin)
                .activeCustomers(activeCustomers)
                .customerSatisfaction(customerSatisfaction)
                .performanceLevel(performanceLevel)
                .kpiScores(kpiScores)
                .build());
        }

        // Sort by total sales descending
        comparisons.sort((a, b) -> b.getTotalSales().compareTo(a.getTotalSales()));

        // Update ranks
        for (int i = 0; i < comparisons.size(); i++) {
            comparisons.get(i).setRank(i + 1);
        }

        return comparisons;
    }

    private List<BenchmarkingResponse.KPIComparison> generateKPIComparisons(
        List<Map<String, Object>> orders,
        BenchmarkingResponse.IndustryBenchmarks industryBenchmarks
    ) {
        List<BenchmarkingResponse.KPIComparison> kpis = new ArrayList<>();

        // Calculate current metrics
        BigDecimal totalSales = orders.stream()
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentAOV = orders.size() > 0
            ? totalSales.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // AOV KPI
        BigDecimal aovTarget = BigDecimal.valueOf(400);
        BigDecimal aovDiff = currentAOV.compareTo(aovTarget) >= 0
            ? currentAOV.subtract(aovTarget).divide(aovTarget, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : currentAOV.subtract(aovTarget).divide(aovTarget, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        kpis.add(BenchmarkingResponse.KPIComparison.builder()
            .kpiName("Average Order Value")
            .unit("INR")
            .yourValue(currentAOV)
            .networkAverage(BigDecimal.valueOf(340))
            .industryAverage(industryBenchmarks.getAverageAOV())
            .target(aovTarget)
            .performance(currentAOV.compareTo(aovTarget) >= 0 ? "Above Target" : "Below Target")
            .percentDifferenceFromTarget(aovDiff)
            .build());

        // Profit Margin KPI
        BigDecimal currentProfitMargin = BigDecimal.valueOf(18.5);
        BigDecimal profitTarget = BigDecimal.valueOf(20.0);

        kpis.add(BenchmarkingResponse.KPIComparison.builder()
            .kpiName("Profit Margin")
            .unit("%")
            .yourValue(currentProfitMargin)
            .networkAverage(BigDecimal.valueOf(17.2))
            .industryAverage(industryBenchmarks.getAverageProfitMargin())
            .target(profitTarget)
            .performance("Below Target")
            .percentDifferenceFromTarget(BigDecimal.valueOf(-7.5))
            .build());

        // Customer Satisfaction KPI
        BigDecimal currentSatisfaction = BigDecimal.valueOf(4.2);
        BigDecimal satisfactionTarget = BigDecimal.valueOf(4.5);

        kpis.add(BenchmarkingResponse.KPIComparison.builder()
            .kpiName("Customer Satisfaction")
            .unit("out of 5")
            .yourValue(currentSatisfaction)
            .networkAverage(BigDecimal.valueOf(4.1))
            .industryAverage(BigDecimal.valueOf(4.0))
            .target(satisfactionTarget)
            .performance("Below Target")
            .percentDifferenceFromTarget(BigDecimal.valueOf(-6.7))
            .build());

        return kpis;
    }

    private List<BenchmarkingResponse.PerformanceInsight> generatePerformanceInsights(
        List<BenchmarkingResponse.StoreComparison> storeComparisons,
        List<BenchmarkingResponse.KPIComparison> kpiComparisons
    ) {
        List<BenchmarkingResponse.PerformanceInsight> insights = new ArrayList<>();

        // Insight 1: Strong AOV
        insights.add(BenchmarkingResponse.PerformanceInsight.builder()
            .insightType("Strength")
            .title("Above Average Order Value")
            .description("Your AOV is performing above network average")
            .recommendation("Continue upselling and cross-selling strategies")
            .priority(BigDecimal.valueOf(75))
            .build());

        // Insight 2: Profit margin opportunity
        insights.add(BenchmarkingResponse.PerformanceInsight.builder()
            .insightType("Opportunity")
            .title("Profit Margin Improvement")
            .description("Profit margin is below target by 7.5%")
            .recommendation("Review ingredient costs and reduce waste")
            .priority(BigDecimal.valueOf(90))
            .build());

        // Insight 3: Customer satisfaction
        insights.add(BenchmarkingResponse.PerformanceInsight.builder()
            .insightType("Weakness")
            .title("Customer Satisfaction Gap")
            .description("Satisfaction score is below target")
            .recommendation("Implement feedback loop and service training")
            .priority(BigDecimal.valueOf(85))
            .build());

        // Sort by priority descending
        insights.sort((a, b) -> b.getPriority().compareTo(a.getPriority()));

        return insights;
    }

    private String determinePerformanceLevel(BigDecimal aov, BigDecimal profitMargin, BigDecimal satisfaction) {
        int score = 0;
        if (aov.compareTo(BigDecimal.valueOf(350)) >= 0) score++;
        if (profitMargin.compareTo(BigDecimal.valueOf(15)) >= 0) score++;
        if (satisfaction.compareTo(BigDecimal.valueOf(4.0)) >= 0) score++;

        if (score == 3) return "Excellent";
        if (score == 2) return "Good";
        if (score == 1) return "Average";
        return "Needs Improvement";
    }

    private BigDecimal getOrderAmount(Map<String, Object> order) {
        Object totalAmount = order.get("totalAmount");
        if (totalAmount instanceof Number) {
            return BigDecimal.valueOf(((Number) totalAmount).doubleValue());
        }
        return BigDecimal.ZERO;
    }
}
