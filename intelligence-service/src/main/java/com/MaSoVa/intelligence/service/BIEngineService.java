package com.MaSoVa.intelligence.service;

import com.MaSoVa.intelligence.client.*;
import com.MaSoVa.intelligence.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BIEngineService {

    private static final Logger log = LoggerFactory.getLogger(BIEngineService.class);

    private final OrderServiceClient orderServiceClient;
    private final CustomerServiceClient customerServiceClient;

    public BIEngineService(OrderServiceClient orderServiceClient,
                          CustomerServiceClient customerServiceClient) {
        this.orderServiceClient = orderServiceClient;
        this.customerServiceClient = customerServiceClient;
    }

    /**
     * Generate sales forecast using historical data and trend analysis
     */
    @Cacheable(value = "salesForecast", key = "#storeId + '-' + #period + '-' + #days")
    public SalesForecastResponse generateSalesForecast(String storeId, String period, int days) {
        log.info("Generating sales forecast for store: {}, period: {}, days: {}", storeId, period, days);

        LocalDate today = LocalDate.now();
        LocalDate historicalStart = today.minusDays(90); // Use 90 days of historical data

        // Get historical orders
        List<Map<String, Object>> historicalOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(historicalStart, LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        // Calculate historical daily averages
        Map<Integer, BigDecimal> dayOfWeekAverages = calculateDayOfWeekAverages(historicalOrders);
        BigDecimal overallDailyAverage = calculateOverallAverage(historicalOrders);
        BigDecimal trendGrowthRate = calculateTrendGrowthRate(historicalOrders);

        // Generate forecast data points
        List<SalesForecastResponse.ForecastDataPoint> forecasts = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        BigDecimal totalForecastedSales = BigDecimal.ZERO;

        for (int i = 1; i <= days; i++) {
            LocalDate forecastDate = today.plusDays(i);
            int dayOfWeek = forecastDate.getDayOfWeek().getValue();

            // Base forecast on day of week average
            BigDecimal baseForecast = dayOfWeekAverages.getOrDefault(dayOfWeek, overallDailyAverage);

            // Apply trend growth rate
            BigDecimal growthMultiplier = BigDecimal.ONE.add(
                trendGrowthRate.multiply(BigDecimal.valueOf(i / 30.0))
            );
            BigDecimal forecastedSales = baseForecast.multiply(growthMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

            // Calculate confidence intervals (±15%)
            BigDecimal variance = forecastedSales.multiply(BigDecimal.valueOf(0.15));
            BigDecimal lowerBound = forecastedSales.subtract(variance);
            BigDecimal upperBound = forecastedSales.add(variance);

            // Estimate number of orders
            BigDecimal avgOrderValue = calculateAverageOrderValue(historicalOrders);
            BigDecimal forecastedOrders = avgOrderValue.compareTo(BigDecimal.ZERO) > 0
                ? forecastedSales.divide(avgOrderValue, 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            forecasts.add(SalesForecastResponse.ForecastDataPoint.builder()
                .date(forecastDate)
                .label(forecastDate.format(formatter))
                .forecastedSales(forecastedSales)
                .forecastedOrders(forecastedOrders)
                .lowerBound(lowerBound)
                .upperBound(upperBound)
                .historicalAverage(baseForecast)
                .build());

            totalForecastedSales = totalForecastedSales.add(forecastedSales);
        }

        // Calculate confidence level based on data consistency
        BigDecimal confidenceLevel = calculateConfidenceLevel(historicalOrders);
        String modelAccuracy = determineModelAccuracy(confidenceLevel);

        return SalesForecastResponse.builder()
                .forecastPeriod(period.toUpperCase())
                .forecasts(forecasts)
                .totalForecastedSales(totalForecastedSales)
                .confidenceLevel(confidenceLevel)
                .modelAccuracy(modelAccuracy)
                .forecastGeneratedAt(LocalDate.now())
                .build();
    }

    /**
     * Analyze customer behavior patterns
     */
    @Cacheable(value = "customerBehavior", key = "#p0")
    public CustomerBehaviorResponse analyzeCustomerBehavior(String storeId) {
        log.info("Analyzing customer behavior for store: {}", storeId);

        List<Map<String, Object>> allCustomers = customerServiceClient.getAllCustomers();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);

        // Get orders for the last year to calculate LTV
        List<Map<String, Object>> yearOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(today.minusYears(1), LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        // Calculate metrics
        int totalCustomers = allCustomers.size();
        Set<String> activeCustomerIds = getActiveCustomerIds(yearOrders, thirtyDaysAgo);
        int activeCustomers = activeCustomerIds.size();

        List<Map<String, Object>> newCustomersList = customerServiceClient.getCustomersRegisteredAfter(thirtyDaysAgo);
        int newCustomers = newCustomersList.size();

        // Calculate average lifetime value
        Map<String, BigDecimal> customerSpending = calculateCustomerSpending(yearOrders);
        BigDecimal totalLTV = customerSpending.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageLifetimeValue = totalCustomers > 0
            ? totalLTV.divide(BigDecimal.valueOf(totalCustomers), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Calculate order frequency
        Map<String, Integer> customerOrderCounts = calculateCustomerOrderCounts(yearOrders);
        double avgOrderFrequency = customerOrderCounts.values().stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);

        // Segment customers
        List<CustomerBehaviorResponse.CustomerSegment> segments = segmentCustomers(
            allCustomers, customerSpending, customerOrderCounts, totalCustomers
        );

        // Identify behavior patterns
        List<CustomerBehaviorResponse.BehaviorPattern> patterns = identifyBehaviorPatterns(yearOrders);

        return CustomerBehaviorResponse.builder()
                .totalCustomers(totalCustomers)
                .activeCustomers(activeCustomers)
                .newCustomers(newCustomers)
                .averageLifetimeValue(averageLifetimeValue)
                .averageOrderFrequency(BigDecimal.valueOf(avgOrderFrequency).setScale(2, RoundingMode.HALF_UP))
                .segments(segments)
                .patterns(patterns)
                .build();
    }

    /**
     * Predict customer churn risk
     */
    @Cacheable(value = "churnPrediction", key = "#p0")
    public ChurnPredictionResponse predictChurn(String storeId) {
        log.info("Predicting customer churn for store: {}", storeId);

        List<Map<String, Object>> allCustomers = customerServiceClient.getAllCustomers();
        LocalDate today = LocalDate.now();

        // Get orders for the last 6 months
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(today.minusMonths(6), LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        Map<String, LocalDateTime> lastOrderDates = getLastOrderDates(orders);
        Map<String, BigDecimal> customerSpending = calculateCustomerSpending(orders);
        Map<String, Integer> orderCounts = calculateCustomerOrderCounts(orders);

        List<ChurnPredictionResponse.ChurnRiskCustomer> atRiskCustomers = new ArrayList<>();
        int highRisk = 0, mediumRisk = 0, lowRisk = 0;

        for (Map<String, Object> customer : allCustomers) {
            String customerId = (String) customer.get("id");
            String customerName = (String) customer.get("name");
            String email = (String) customer.get("email");

            LocalDateTime lastOrder = lastOrderDates.get(customerId);
            if (lastOrder == null) {
                // Never ordered - skip or mark as dormant
                continue;
            }

            long daysSinceLastOrder = ChronoUnit.DAYS.between(lastOrder.toLocalDate(), today);
            BigDecimal lifetimeValue = customerSpending.getOrDefault(customerId, BigDecimal.ZERO);
            int totalOrders = orderCounts.getOrDefault(customerId, 0);

            // Calculate churn probability based on multiple factors
            BigDecimal churnProbability = calculateChurnProbability(daysSinceLastOrder, totalOrders, lifetimeValue);
            String riskLevel = determineRiskLevel(churnProbability);
            List<String> riskFactors = identifyRiskFactors(daysSinceLastOrder, totalOrders, lifetimeValue);

            if (churnProbability.compareTo(BigDecimal.valueOf(30)) >= 0) {
                atRiskCustomers.add(ChurnPredictionResponse.ChurnRiskCustomer.builder()
                    .customerId(customerId)
                    .customerName(customerName)
                    .email(email)
                    .riskLevel(riskLevel)
                    .churnProbability(churnProbability)
                    .daysSinceLastOrder((int) daysSinceLastOrder)
                    .lifetimeValue(lifetimeValue)
                    .totalOrders(totalOrders)
                    .lastOrderDate(lastOrder)
                    .riskFactors(riskFactors)
                    .build());

                if ("HIGH".equals(riskLevel)) highRisk++;
                else if ("MEDIUM".equals(riskLevel)) mediumRisk++;
                else lowRisk++;
            }
        }

        // Sort by churn probability descending
        atRiskCustomers.sort((a, b) -> b.getChurnProbability().compareTo(a.getChurnProbability()));

        // Calculate predicted churn rate
        BigDecimal predictedChurnRate = allCustomers.size() > 0
            ? BigDecimal.valueOf(atRiskCustomers.size())
                .divide(BigDecimal.valueOf(allCustomers.size()), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        // Identify common churn factors
        List<ChurnPredictionResponse.ChurnFactor> churnFactors = identifyChurnFactors(atRiskCustomers);

        return ChurnPredictionResponse.builder()
                .totalCustomersAnalyzed(allCustomers.size())
                .highRiskCustomers(highRisk)
                .mediumRiskCustomers(mediumRisk)
                .lowRiskCustomers(lowRisk)
                .predictedChurnRate(predictedChurnRate)
                .atRiskCustomers(atRiskCustomers.stream().limit(50).collect(Collectors.toList()))
                .churnFactors(churnFactors)
                .build();
    }

    // Helper methods

    private Map<Integer, BigDecimal> calculateDayOfWeekAverages(List<Map<String, Object>> orders) {
        Map<Integer, List<BigDecimal>> salesByDay = new HashMap<>();

        // Group sales by day of week
        Map<LocalDate, BigDecimal> dailySales = new HashMap<>();
        for (Map<String, Object> order : orders) {
            LocalDate date = getOrderDate(order);
            BigDecimal amount = getOrderAmount(order);
            dailySales.merge(date, amount, BigDecimal::add);
        }

        for (Map.Entry<LocalDate, BigDecimal> entry : dailySales.entrySet()) {
            int dayOfWeek = entry.getKey().getDayOfWeek().getValue();
            salesByDay.computeIfAbsent(dayOfWeek, k -> new ArrayList<>()).add(entry.getValue());
        }

        // Calculate averages
        Map<Integer, BigDecimal> averages = new HashMap<>();
        for (Map.Entry<Integer, List<BigDecimal>> entry : salesByDay.entrySet()) {
            BigDecimal sum = entry.getValue().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = sum.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);
            averages.put(entry.getKey(), avg);
        }

        return averages;
    }

    private BigDecimal calculateOverallAverage(List<Map<String, Object>> orders) {
        Map<LocalDate, BigDecimal> dailySales = new HashMap<>();
        for (Map<String, Object> order : orders) {
            LocalDate date = getOrderDate(order);
            BigDecimal amount = getOrderAmount(order);
            dailySales.merge(date, amount, BigDecimal::add);
        }

        if (dailySales.isEmpty()) return BigDecimal.valueOf(5000); // Default fallback

        BigDecimal totalSales = dailySales.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return totalSales.divide(BigDecimal.valueOf(dailySales.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTrendGrowthRate(List<Map<String, Object>> orders) {
        // Simple linear trend calculation
        // Compare last 30 days vs previous 30 days
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        LocalDate sixtyDaysAgo = today.minusDays(60);

        BigDecimal recentSales = orders.stream()
            .filter(o -> {
                LocalDate date = getOrderDate(o);
                return date.isAfter(thirtyDaysAgo) && !date.isAfter(today);
            })
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousSales = orders.stream()
            .filter(o -> {
                LocalDate date = getOrderDate(o);
                return date.isAfter(sixtyDaysAgo) && !date.isAfter(thirtyDaysAgo);
            })
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (previousSales.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return recentSales.subtract(previousSales)
            .divide(previousSales, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAverageOrderValue(List<Map<String, Object>> orders) {
        if (orders.isEmpty()) return BigDecimal.valueOf(300); // Default fallback

        BigDecimal total = orders.stream()
            .map(this::getOrderAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return total.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateConfidenceLevel(List<Map<String, Object>> orders) {
        // Base confidence on amount of historical data and consistency
        int dataPoints = orders.size();
        BigDecimal baseConfidence = BigDecimal.valueOf(Math.min(dataPoints / 100.0 * 100, 85));

        // Adjust for data recency
        LocalDate today = LocalDate.now();
        long recentOrders = orders.stream()
            .filter(o -> getOrderDate(o).isAfter(today.minusDays(30)))
            .count();

        BigDecimal recencyBonus = BigDecimal.valueOf(recentOrders > 50 ? 10 : 5);

        return baseConfidence.add(recencyBonus).min(BigDecimal.valueOf(95));
    }

    private String determineModelAccuracy(BigDecimal confidenceLevel) {
        if (confidenceLevel.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return "HIGH";
        } else if (confidenceLevel.compareTo(BigDecimal.valueOf(60)) >= 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private LocalDate getOrderDate(Map<String, Object> order) {
        Object createdAt = order.get("createdAt");
        if (createdAt instanceof LocalDateTime) {
            return ((LocalDateTime) createdAt).toLocalDate();
        }
        return LocalDate.now();
    }

    private BigDecimal getOrderAmount(Map<String, Object> order) {
        Object totalAmount = order.get("totalAmount");
        if (totalAmount instanceof Number) {
            return BigDecimal.valueOf(((Number) totalAmount).doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private Set<String> getActiveCustomerIds(List<Map<String, Object>> orders, LocalDate since) {
        Set<String> activeIds = new HashSet<>();
        for (Map<String, Object> order : orders) {
            if (getOrderDate(order).isAfter(since)) {
                String customerId = (String) order.get("customerId");
                if (customerId != null) {
                    activeIds.add(customerId);
                }
            }
        }
        return activeIds;
    }

    private Map<String, BigDecimal> calculateCustomerSpending(List<Map<String, Object>> orders) {
        Map<String, BigDecimal> spending = new HashMap<>();
        for (Map<String, Object> order : orders) {
            String customerId = (String) order.get("customerId");
            if (customerId != null) {
                BigDecimal amount = getOrderAmount(order);
                spending.merge(customerId, amount, BigDecimal::add);
            }
        }
        return spending;
    }

    private Map<String, Integer> calculateCustomerOrderCounts(List<Map<String, Object>> orders) {
        Map<String, Integer> counts = new HashMap<>();
        for (Map<String, Object> order : orders) {
            String customerId = (String) order.get("customerId");
            if (customerId != null) {
                counts.merge(customerId, 1, (a, b) -> a + b);
            }
        }
        return counts;
    }

    private List<CustomerBehaviorResponse.CustomerSegment> segmentCustomers(
        List<Map<String, Object>> customers,
        Map<String, BigDecimal> spending,
        Map<String, Integer> orderCounts,
        int totalCustomers
    ) {
        Map<String, List<String>> segments = new HashMap<>();
        segments.put("VIP", new ArrayList<>());
        segments.put("Regular", new ArrayList<>());
        segments.put("Occasional", new ArrayList<>());
        segments.put("At Risk", new ArrayList<>());
        segments.put("New", new ArrayList<>());

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);

        for (Map<String, Object> customer : customers) {
            String customerId = (String) customer.get("id");
            BigDecimal ltv = spending.getOrDefault(customerId, BigDecimal.ZERO);
            int orders = orderCounts.getOrDefault(customerId, 0);

            Object registeredAtObj = customer.get("createdAt");
            boolean isNew = false;
            if (registeredAtObj instanceof LocalDateTime) {
                isNew = ((LocalDateTime) registeredAtObj).toLocalDate().isAfter(thirtyDaysAgo);
            }

            String segment;
            if (isNew) {
                segment = "New";
            } else if (ltv.compareTo(BigDecimal.valueOf(10000)) >= 0 && orders >= 10) {
                segment = "VIP";
            } else if (orders >= 5) {
                segment = "Regular";
            } else if (orders >= 2) {
                segment = "Occasional";
            } else {
                segment = "At Risk";
            }

            segments.get(segment).add(customerId);
        }

        List<CustomerBehaviorResponse.CustomerSegment> result = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : segments.entrySet()) {
            String segmentName = entry.getKey();
            List<String> customerIds = entry.getValue();

            BigDecimal totalRevenue = customerIds.stream()
                .map(id -> spending.getOrDefault(id, BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            int totalOrders = customerIds.stream()
                .mapToInt(id -> orderCounts.getOrDefault(id, 0))
                .sum();

            BigDecimal avgAOV = !customerIds.isEmpty() && totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            BigDecimal percentOfTotal = totalCustomers > 0
                ? BigDecimal.valueOf(customerIds.size())
                    .divide(BigDecimal.valueOf(totalCustomers), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

            int avgOrdersPerMonth = !customerIds.isEmpty()
                ? totalOrders / customerIds.size()
                : 0;

            result.add(CustomerBehaviorResponse.CustomerSegment.builder()
                .segmentName(segmentName)
                .customerCount(customerIds.size())
                .percentOfTotal(percentOfTotal)
                .averageOrderValue(avgAOV)
                .totalRevenue(totalRevenue)
                .averageOrdersPerMonth(avgOrdersPerMonth)
                .build());
        }

        return result;
    }

    private List<CustomerBehaviorResponse.BehaviorPattern> identifyBehaviorPatterns(List<Map<String, Object>> orders) {
        List<CustomerBehaviorResponse.BehaviorPattern> patterns = new ArrayList<>();

        // Peak ordering time pattern
        Map<Integer, Long> ordersByHour = orders.stream()
            .collect(Collectors.groupingBy(
                o -> {
                    Object createdAt = o.get("createdAt");
                    if (createdAt instanceof LocalDateTime) {
                        return ((LocalDateTime) createdAt).getHour();
                    }
                    return 12;
                },
                Collectors.counting()
            ));

        Integer peakHour = ordersByHour.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(12);

        Map<String, Object> peakTimeData = new HashMap<>();
        peakTimeData.put("peakHour", peakHour);
        peakTimeData.put("orderCount", ordersByHour.getOrDefault(peakHour, 0L));

        patterns.add(CustomerBehaviorResponse.BehaviorPattern.builder()
            .patternType("Peak Ordering Time")
            .description(String.format("Most orders placed around %d:00", peakHour))
            .data(peakTimeData)
            .significance(BigDecimal.valueOf(85))
            .build());

        return patterns;
    }

    private Map<String, LocalDateTime> getLastOrderDates(List<Map<String, Object>> orders) {
        Map<String, LocalDateTime> lastDates = new HashMap<>();
        for (Map<String, Object> order : orders) {
            String customerId = (String) order.get("customerId");
            if (customerId != null) {
                Object createdAt = order.get("createdAt");
                if (createdAt instanceof LocalDateTime) {
                    LocalDateTime orderDate = (LocalDateTime) createdAt;
                    lastDates.merge(customerId, orderDate, (existing, newDate) ->
                        newDate.isAfter(existing) ? newDate : existing
                    );
                }
            }
        }
        return lastDates;
    }

    private BigDecimal calculateChurnProbability(long daysSinceLastOrder, int totalOrders, BigDecimal ltv) {
        BigDecimal daysFactor = BigDecimal.valueOf(Math.min(daysSinceLastOrder / 180.0 * 60, 60));
        BigDecimal ordersFactor = totalOrders < 3 ? BigDecimal.valueOf(30) :
                                   totalOrders < 6 ? BigDecimal.valueOf(15) : BigDecimal.ZERO;
        BigDecimal ltvFactor = ltv.compareTo(BigDecimal.valueOf(1000)) < 0 ? BigDecimal.valueOf(10) : BigDecimal.ZERO;

        return daysFactor.add(ordersFactor).add(ltvFactor).min(BigDecimal.valueOf(100));
    }

    private String determineRiskLevel(BigDecimal churnProbability) {
        if (churnProbability.compareTo(BigDecimal.valueOf(70)) >= 0) {
            return "HIGH";
        } else if (churnProbability.compareTo(BigDecimal.valueOf(40)) >= 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private List<String> identifyRiskFactors(long daysSinceLastOrder, int totalOrders, BigDecimal ltv) {
        List<String> factors = new ArrayList<>();
        if (daysSinceLastOrder > 60) {
            factors.add("Inactive for over 60 days");
        }
        if (totalOrders < 3) {
            factors.add("Low order frequency");
        }
        if (ltv.compareTo(BigDecimal.valueOf(1000)) < 0) {
            factors.add("Low lifetime value");
        }
        return factors;
    }

    private List<ChurnPredictionResponse.ChurnFactor> identifyChurnFactors(
        List<ChurnPredictionResponse.ChurnRiskCustomer> atRiskCustomers
    ) {
        Map<String, Integer> factorCounts = new HashMap<>();
        for (ChurnPredictionResponse.ChurnRiskCustomer customer : atRiskCustomers) {
            for (String factor : customer.getRiskFactors()) {
                factorCounts.merge(factor, 1, (a, b) -> a + b);
            }
        }

        List<ChurnPredictionResponse.ChurnFactor> factors = new ArrayList<>();
        factorCounts.forEach((factor, count) -> {
            BigDecimal impact = BigDecimal.valueOf(count)
                .divide(BigDecimal.valueOf(atRiskCustomers.size()), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

            factors.add(ChurnPredictionResponse.ChurnFactor.builder()
                .factorName(factor)
                .description("Customers affected by " + factor.toLowerCase())
                .impactScore(impact)
                .customersAffected(count)
                .build());
        });

        factors.sort((a, b) -> b.getImpactScore().compareTo(a.getImpactScore()));
        return factors;
    }

    /**
     * Generate demand forecast for menu items
     */
    @Cacheable(value = "demandForecast", key = "#storeId + '-' + #period")
    public DemandForecastResponse generateDemandForecast(String storeId, String period) {
        log.info("Generating demand forecast for store: {}, period: {}", storeId, period);

        LocalDate today = LocalDate.now();
        int forecastDays = "MONTHLY".equalsIgnoreCase(period) ? 30 : 7;
        LocalDate historicalStart = today.minusDays(90);

        // Get historical orders
        List<Map<String, Object>> historicalOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(historicalStart, LocalTime.MIN),
            LocalDateTime.of(today, LocalTime.MAX)
        );

        // Extract all items from orders
        Map<String, DemandItemData> itemDemandData = new HashMap<>();
        for (Map<String, Object> order : historicalOrders) {
            Object itemsObj = order.get("items");
            if (itemsObj instanceof List<?> itemsList) {
                for (Object itemObj : itemsList) {
                    if (!(itemObj instanceof Map<?, ?>)) continue;
                    Map<?, ?> itemMap = (Map<?, ?>) itemObj;
                    String itemId = (String) itemMap.get("menuItemId");
                    String itemName = (String) itemMap.get("itemName");
                    Object categoryObj = itemMap.get("category");
                    String category = categoryObj != null ? String.valueOf(categoryObj) : "Unknown";
                    Object quantityObj = itemMap.get("quantity");
                    int quantity = quantityObj instanceof Number ? ((Number) quantityObj).intValue() : 0;
                    Object priceObj = itemMap.get("price");
                    BigDecimal price = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue()) : BigDecimal.ZERO;

                    itemDemandData.computeIfAbsent(itemId, k -> new DemandItemData(itemName, category))
                        .addQuantity(quantity, price);
                }
            }
        }

        // Calculate forecasts for each item
        List<DemandForecastResponse.ItemDemandForecast> itemForecasts = new ArrayList<>();
        for (Map.Entry<String, DemandItemData> entry : itemDemandData.entrySet()) {
            String itemId = entry.getKey();
            DemandItemData data = entry.getValue();

            // Calculate historical average per day
            int historicalQuantity = data.getTotalQuantity();
            int historicalDays = (int) ChronoUnit.DAYS.between(historicalStart, today);
            int dailyAverage = historicalDays > 0 ? historicalQuantity / historicalDays : 0;

            // Forecast with 10% growth assumption
            int forecastedQuantity = (int) (dailyAverage * forecastDays * 1.10);
            BigDecimal forecastedRevenue = data.getAveragePrice()
                .multiply(BigDecimal.valueOf(forecastedQuantity));

            // Determine growth trend
            BigDecimal growthTrend = BigDecimal.valueOf(10.0); // Simplified: 10% growth

            // Stock recommendation
            String recommendation = forecastedQuantity > dailyAverage * forecastDays * 1.2 ? "Stock Up" :
                                    forecastedQuantity < dailyAverage * forecastDays * 0.8 ? "Reduce Stock" : "Normal";

            itemForecasts.add(DemandForecastResponse.ItemDemandForecast.builder()
                .itemId(itemId)
                .itemName(data.getItemName())
                .category(data.getCategory())
                .forecastedQuantity(forecastedQuantity)
                .forecastedRevenue(forecastedRevenue)
                .historicalAverageQuantity(dailyAverage * forecastDays)
                .growthTrend(growthTrend)
                .recommendation(recommendation)
                .dailyBreakdown(new ArrayList<>()) // Can be expanded
                .build());
        }

        // Sort by forecasted quantity descending
        itemForecasts.sort((a, b) -> Integer.compare(b.getForecastedQuantity(), a.getForecastedQuantity()));

        // Calculate category forecasts
        Map<String, CategoryDemandData> categoryData = new HashMap<>();
        for (DemandForecastResponse.ItemDemandForecast itemForecast : itemForecasts) {
            categoryData.computeIfAbsent(itemForecast.getCategory(), k -> new CategoryDemandData())
                .add(itemForecast.getForecastedQuantity(), itemForecast.getForecastedRevenue());
        }

        List<DemandForecastResponse.CategoryDemandForecast> categoryForecasts = new ArrayList<>();
        for (Map.Entry<String, CategoryDemandData> entry : categoryData.entrySet()) {
            CategoryDemandData data = entry.getValue();
            categoryForecasts.add(DemandForecastResponse.CategoryDemandForecast.builder()
                .category(entry.getKey())
                .forecastedQuantity(data.getQuantity())
                .forecastedRevenue(data.getRevenue())
                .percentChange(BigDecimal.valueOf(10)) // Simplified
                .trend("UP")
                .build());
        }

        return DemandForecastResponse.builder()
                .forecastPeriod(period.toUpperCase())
                .itemForecasts(itemForecasts.stream().limit(50).collect(Collectors.toList()))
                .categoryForecasts(categoryForecasts)
                .forecastGeneratedAt(LocalDate.now())
                .build();
    }

    // Helper classes for demand forecast
    private static class DemandItemData {
        private final String itemName;
        private final String category;
        private int totalQuantity;
        private BigDecimal totalRevenue;

        public DemandItemData(String itemName, String category) {
            this.itemName = itemName;
            this.category = category;
            this.totalQuantity = 0;
            this.totalRevenue = BigDecimal.ZERO;
        }

        public void addQuantity(int quantity, BigDecimal price) {
            this.totalQuantity += quantity;
            this.totalRevenue = this.totalRevenue.add(price.multiply(BigDecimal.valueOf(quantity)));
        }

        public String getItemName() { return itemName; }
        public String getCategory() { return category; }
        public int getTotalQuantity() { return totalQuantity; }
        public BigDecimal getAveragePrice() {
            return totalQuantity > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalQuantity), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        }
    }

    private static class CategoryDemandData {
        private int quantity;
        private BigDecimal revenue;

        public CategoryDemandData() {
            this.quantity = 0;
            this.revenue = BigDecimal.ZERO;
        }

        public void add(int qty, BigDecimal rev) {
            this.quantity += qty;
            this.revenue = this.revenue.add(rev);
        }

        public int getQuantity() { return quantity; }
        public BigDecimal getRevenue() { return revenue; }
    }
}
