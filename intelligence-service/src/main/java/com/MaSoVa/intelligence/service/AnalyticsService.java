package com.MaSoVa.intelligence.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.client.UserServiceClient;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    // EU primary store hours (Berlin). Store-specific zones can be layered later via countryCode.
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Berlin");

    private final OrderServiceClient orderServiceClient;
    private final UserServiceClient userServiceClient;

    public AnalyticsService(OrderServiceClient orderServiceClient, UserServiceClient userServiceClient) {
        this.orderServiceClient = orderServiceClient;
        this.userServiceClient = userServiceClient;
    }

    /**
     * Get sales metrics for today compared to yesterday and last year
     */
    @Cacheable(value = "salesMetrics", key = "'v2-' + #p0")
    public SalesMetricsResponse getTodaySalesMetrics(String storeId) {
        log.info("Calculating sales metrics for store: {}", storeId);

        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, 30);
        if (hasSummary(summary)) {
            BigDecimal todaySales = decimal(summary.get("todaySales"));
            int todayOrderCount = integer(summary.get("todayOrderCount"));
            return SalesMetricsResponse.builder()
                    .todaySales(todaySales)
                    .yesterdaySalesAtSameTime(BigDecimal.ZERO)
                    .lastYearSameDaySales(BigDecimal.ZERO)
                    .todayOrderCount(todayOrderCount)
                    .yesterdayOrderCountAtSameTime(0)
                    .lastYearSameDayOrderCount(0)
                    .percentChangeFromYesterday(BigDecimal.ZERO)
                    .percentChangeFromLastYear(BigDecimal.ZERO)
                    .trend("STABLE")
                    .build();
        }

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate yesterday = today.minusDays(1);
        LocalDate lastYear = today.minusYears(1);
        LocalTime currentTime = LocalTime.now();

        // Get today's orders
        List<Map<String, Object>> todayOrders = orderServiceClient.getOrdersByDate(today);
        BigDecimal todaySales = calculateTotalSales(todayOrders);
        int todayOrderCount = (int) todayOrders.stream().filter(this::isCompletedOrder).count();

        // Get yesterday's orders up to same time
        List<Map<String, Object>> yesterdayOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(yesterday, LocalTime.MIN),
            LocalDateTime.of(yesterday, currentTime)
        );
        BigDecimal yesterdaySales = calculateTotalSales(yesterdayOrders);
        int yesterdayOrderCount = yesterdayOrders.size();

        // Get last year same day orders
        List<Map<String, Object>> lastYearOrders = orderServiceClient.getOrdersByDate(lastYear);
        BigDecimal lastYearSales = calculateTotalSales(lastYearOrders);
        int lastYearOrderCount = lastYearOrders.size();

        // Calculate trends
        BigDecimal percentChangeFromYesterday = calculatePercentChange(todaySales, yesterdaySales);
        BigDecimal percentChangeFromLastYear = calculatePercentChange(todaySales, lastYearSales);
        String trend = determineTrend(percentChangeFromYesterday);

        return SalesMetricsResponse.builder()
                .todaySales(todaySales)
                .yesterdaySalesAtSameTime(yesterdaySales)
                .lastYearSameDaySales(lastYearSales)
                .todayOrderCount(todayOrderCount)
                .yesterdayOrderCountAtSameTime(yesterdayOrderCount)
                .lastYearSameDayOrderCount(lastYearOrderCount)
                .percentChangeFromYesterday(percentChangeFromYesterday)
                .percentChangeFromLastYear(percentChangeFromLastYear)
                .trend(trend)
                .build();
    }

    /**
     * Get average order value for today
     */
    @Cacheable(value = "salesMetrics", key = "'v2-aov-' + #p0")
    public AverageOrderValueResponse getAverageOrderValue(String storeId) {
        log.info("Calculating average order value for store: {}", storeId);

        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, 7);
        if (hasSummary(summary)) {
            BigDecimal todaySales = decimal(summary.get("todaySales"));
            int todayOrderCount = integer(summary.get("todayOrderCount"));
            BigDecimal todayAOV = todayOrderCount > 0
                    ? todaySales.divide(BigDecimal.valueOf(todayOrderCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return AverageOrderValueResponse.builder()
                    .averageOrderValue(todayAOV)
                    .yesterdayAverageOrderValue(BigDecimal.ZERO)
                    .percentChange(BigDecimal.ZERO)
                    .trend("STABLE")
                    .totalOrders(todayOrderCount)
                    .totalSales(todaySales)
                    .build();
        }

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate yesterday = today.minusDays(1);

        // Get today's orders
        List<Map<String, Object>> todayOrders = orderServiceClient.getOrdersByDate(today);
        BigDecimal todaySales = calculateTotalSales(todayOrders);
        int todayOrderCount = (int) todayOrders.stream().filter(this::isCompletedOrder).count();
        BigDecimal todayAOV = todayOrderCount > 0
            ? todaySales.divide(BigDecimal.valueOf(todayOrderCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Get yesterday's orders
        List<Map<String, Object>> yesterdayOrders = orderServiceClient.getOrdersByDate(yesterday);
        BigDecimal yesterdaySales = calculateTotalSales(yesterdayOrders);
        int yesterdayOrderCount = yesterdayOrders.size();
        BigDecimal yesterdayAOV = yesterdayOrderCount > 0
            ? yesterdaySales.divide(BigDecimal.valueOf(yesterdayOrderCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        BigDecimal percentChange = calculatePercentChange(todayAOV, yesterdayAOV);
        String trend = determineTrend(percentChange);

        return AverageOrderValueResponse.builder()
                .averageOrderValue(todayAOV)
                .yesterdayAverageOrderValue(yesterdayAOV)
                .percentChange(percentChange)
                .trend(trend)
                .totalOrders(todayOrderCount)
                .totalSales(todaySales)
                .build();
    }

    /**
     * Get driver status for a store
     */
    @Cacheable(value = "driverStatus", key = "#p0")
    public DriverStatusResponse getDriverStatus(String storeId) {
        log.info("Fetching driver status for store: {}", storeId);

        List<Map<String, Object>> drivers = userServiceClient.getDriversByStore(storeId);

        int totalDrivers = drivers.size();
        long availableDrivers = drivers.stream()
                .filter(d -> {
                    Object status = d.get("status");
                    Object online = d.get("isOnline") != null ? d.get("isOnline") : d.get("online");
                    boolean isOnline = Boolean.TRUE.equals(online);
                    return "AVAILABLE".equals(status) || isOnline;
                })
                .count();
        long busyDrivers = drivers.stream()
                .filter(d -> "BUSY".equals(d.get("status"))
                        || (d.get("activeDeliveryCount") instanceof Number n && n.intValue() > 0))
                .count();

        Integer activeDeliveries = orderServiceClient.getActiveDeliveryCount();

        // Calculate completed deliveries today
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        List<Map<String, Object>> todayOrders = orderServiceClient.getOrdersByDate(today);
        long completedDeliveries = todayOrders.stream()
                .filter(o -> "DELIVERY".equals(o.get("orderType")) && "DELIVERED".equals(o.get("status")))
                .count();

        return DriverStatusResponse.builder()
                .totalDrivers(totalDrivers)
                .availableDrivers((int) availableDrivers)
                .busyDrivers((int) busyDrivers)
                .activeDeliveries(activeDeliveries != null ? activeDeliveries : 0)
                .completedTodayDeliveries((int) completedDeliveries)
                .build();
    }

    /**
     * Get staff performance for a specific staff member
     */
    @Cacheable(value = "staffPerformance", key = "#p0")
    public StaffPerformanceResponse getStaffPerformance(String staffId) {
        log.info("Fetching staff performance for: {}", staffId);

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        List<Map<String, Object>> staffOrders = orderServiceClient.getOrdersByStaff(staffId, today);

        int ordersProcessed = staffOrders.size();
        BigDecimal salesGenerated = calculateTotalSales(staffOrders);
        BigDecimal averageOrderValue = ordersProcessed > 0
                ? salesGenerated.divide(BigDecimal.valueOf(ordersProcessed), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Get staff details
        Map<String, Object> staffDetails = userServiceClient.getStaffDetails(staffId);
        String staffName = staffDetails != null ? (String) staffDetails.get("name") : "Unknown";

        // Determine performance level
        String performanceLevel = determinePerformanceLevel(ordersProcessed, salesGenerated);

        return StaffPerformanceResponse.builder()
                .staffId(staffId)
                .staffName(staffName)
                .ordersProcessedToday(ordersProcessed)
                .salesGeneratedToday(salesGenerated)
                .averageOrderValue(averageOrderValue)
                .rank(0) // TODO: Calculate rank among all staff
                .performanceLevel(performanceLevel)
                .build();
    }

    // Helper methods

    private static boolean hasSummary(Map<String, Object> summary) {
        return summary != null && !summary.isEmpty() && summary.get("todaySales") != null;
    }

    private static BigDecimal decimal(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        if (value instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    private static int integer(Object value) {
        if (value instanceof Number n) {
            return n.intValue();
        }
        return 0;
    }

    private static String text(Map<?, ?> map, String key, String fallback) {
        Object value = map.get(key);
        if (value == null) {
            return fallback;
        }
        String asText = String.valueOf(value);
        return asText.isBlank() ? fallback : asText;
    }

    /**
     * Check if order is completed based on its type
     * DELIVERY: status = DELIVERED
     * TAKEAWAY: status = COMPLETED
     * DINE_IN: status = SERVED
     */
    private boolean isCompletedOrder(Map<String, Object> order) {
        String status = (String) order.get("status");
        String orderType = (String) order.get("orderType");

        if (status == null || orderType == null) {
            return false;
        }

        switch (orderType) {
            case "DELIVERY":
                return "DELIVERED".equals(status);
            case "TAKEAWAY":
                return "COMPLETED".equals(status);
            case "DINE_IN":
                return "SERVED".equals(status);
            default:
                // For backward compatibility, also accept DELIVERED for unknown types
                return "DELIVERED".equals(status) || "COMPLETED".equals(status) || "SERVED".equals(status);
        }
    }

    private BigDecimal calculateTotalSales(List<Map<String, Object>> orders) {
        return orders.stream()
                .filter(this::isCompletedOrder)  // Only count completed orders
                .map(order -> {
                    // Try "total" first (correct field name), fallback to "totalAmount" for backwards compatibility
                    Object totalObj = order.get("total");
                    if (totalObj == null) {
                        totalObj = order.get("totalAmount");
                    }

                    if (totalObj instanceof Number) {
                        return BigDecimal.valueOf(((Number) totalObj).doubleValue());
                    }

                    // Handle String representation (MongoDB may return as String)
                    if (totalObj instanceof String) {
                        try {
                            return new BigDecimal((String) totalObj);
                        } catch (NumberFormatException e) {
                            log.warn("Failed to parse total amount: {}", totalObj);
                            return BigDecimal.ZERO;
                        }
                    }

                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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

    private String determineTrend(BigDecimal percentChange) {
        if (percentChange.compareTo(BigDecimal.valueOf(5)) > 0) {
            return "UP";
        } else if (percentChange.compareTo(BigDecimal.valueOf(-5)) < 0) {
            return "DOWN";
        }
        return "STABLE";
    }

    private String determinePerformanceLevel(int ordersProcessed, BigDecimal salesGenerated) {
        if (ordersProcessed >= 50 && salesGenerated.compareTo(BigDecimal.valueOf(10000)) >= 0) {
            return "EXCELLENT";
        } else if (ordersProcessed >= 30 && salesGenerated.compareTo(BigDecimal.valueOf(5000)) >= 0) {
            return "GOOD";
        } else if (ordersProcessed >= 15) {
            return "AVERAGE";
        }
        return "NEEDS_IMPROVEMENT";
    }

    /**
     * Get sales trends for weekly or monthly period
     */
    @Cacheable(value = "salesTrends", key = "'v2-' + #p0 + '-' + #p1")
    public SalesTrendResponse getSalesTrends(String storeId, String period) {
        log.info("Calculating sales trends for store: {}, period: {}", storeId, period);

        int wantedDays = "MONTHLY".equalsIgnoreCase(period) || "MONTH".equalsIgnoreCase(period) ? 30 : 7;
        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, wantedDays);
        if (hasSummary(summary) && summary.get("daily") instanceof List<?> daily && !daily.isEmpty()) {
            List<SalesTrendResponse.DailyDataPoint> dataPoints = new ArrayList<>();
            DateTimeFormatter formatter = wantedDays >= 30
                    ? DateTimeFormatter.ofPattern("MMM dd")
                    : DateTimeFormatter.ofPattern("EEE");
            for (Object row : daily) {
                if (!(row instanceof Map<?, ?> map)) continue;
                String dateStr = String.valueOf(map.get("date"));
                LocalDate date;
                try {
                    date = LocalDate.parse(dateStr);
                } catch (Exception e) {
                    continue;
                }
                BigDecimal daySales = decimal(map.get("sales"));
                int dayCount = integer(map.get("orderCount"));
                BigDecimal dayAOV = dayCount > 0
                        ? daySales.divide(BigDecimal.valueOf(dayCount), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                dataPoints.add(SalesTrendResponse.DailyDataPoint.builder()
                        .date(date)
                        .label(date.format(formatter))
                        .sales(daySales)
                        .orderCount(dayCount)
                        .averageOrderValue(dayAOV)
                        .build());
            }
            BigDecimal totalSales = decimal(summary.get(wantedDays >= 30 ? "rangeSales" : "weekSales"));
            int totalOrders = integer(summary.get(wantedDays >= 30 ? "rangeOrderCount" : "weekOrderCount"));
            BigDecimal avgOrderValue = totalOrders > 0
                    ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return SalesTrendResponse.builder()
                    .period(period.toUpperCase())
                    .dataPoints(dataPoints)
                    .totalSales(totalSales)
                    .totalOrders(totalOrders)
                    .averageOrderValue(avgOrderValue)
                    .percentChangeFromPreviousPeriod(BigDecimal.ZERO)
                    .trend("STABLE")
                    .build();
        }

        LocalDate endDate = LocalDate.now(BUSINESS_ZONE);
        LocalDate startDate;
        int days;

        if ("MONTHLY".equalsIgnoreCase(period)) {
            startDate = endDate.minusDays(29); // Last 30 days
            days = 30;
        } else {
            startDate = endDate.minusDays(6); // Last 7 days
            days = 7;
        }

        // Get orders for the period
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(endDate, LocalTime.MAX)
        );

        // Group orders by date
        Map<LocalDate, List<Map<String, Object>>> ordersByDate = groupOrdersByDate(orders);

        // Create data points for each day
        List<SalesTrendResponse.DailyDataPoint> dataPoints = new ArrayList<>();
        DateTimeFormatter formatter = "MONTHLY".equalsIgnoreCase(period)
            ? DateTimeFormatter.ofPattern("MMM dd")
            : DateTimeFormatter.ofPattern("EEE");

        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            List<Map<String, Object>> dayOrders = ordersByDate.getOrDefault(date, Collections.emptyList());

            BigDecimal daySales = calculateTotalSales(dayOrders);
            int dayOrderCount = dayOrders.size();
            BigDecimal dayAOV = dayOrderCount > 0
                ? daySales.divide(BigDecimal.valueOf(dayOrderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            dataPoints.add(SalesTrendResponse.DailyDataPoint.builder()
                .date(date)
                .label(date.format(formatter))
                .sales(daySales)
                .orderCount(dayOrderCount)
                .averageOrderValue(dayAOV)
                .build());
        }

        // Calculate totals
        BigDecimal totalSales = dataPoints.stream()
            .map(SalesTrendResponse.DailyDataPoint::getSales)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalOrders = dataPoints.stream()
            .mapToInt(SalesTrendResponse.DailyDataPoint::getOrderCount)
            .sum();
        BigDecimal avgOrderValue = totalOrders > 0
            ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Calculate trend (compare with previous period)
        LocalDate prevStartDate = startDate.minusDays(days);
        List<Map<String, Object>> prevOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(prevStartDate, LocalTime.MIN),
            LocalDateTime.of(startDate.minusDays(1), LocalTime.MAX)
        );
        BigDecimal prevSales = calculateTotalSales(prevOrders);
        BigDecimal percentChange = calculatePercentChange(totalSales, prevSales);
        String trend = determineTrend(percentChange);

        return SalesTrendResponse.builder()
                .period(period.toUpperCase())
                .dataPoints(dataPoints)
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .averageOrderValue(avgOrderValue)
                .percentChangeFromPreviousPeriod(percentChange)
                .trend(trend)
                .build();
    }

    /**
     * Get order type breakdown (Dine-in, Pickup, Delivery)
     */
    @Cacheable(value = "orderTypeBreakdown", key = "'v2-' + #p0")
    public OrderTypeBreakdownResponse getOrderTypeBreakdown(String storeId) {
        log.info("Calculating order type breakdown for store: {}", storeId);

        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, 30);
        if (hasSummary(summary) && summary.get("orderTypes") instanceof List<?> types && !types.isEmpty()) {
            List<OrderTypeBreakdownResponse.OrderTypeData> breakdown = new ArrayList<>();
            for (Object row : types) {
                if (!(row instanceof Map<?, ?> map)) continue;
                breakdown.add(OrderTypeBreakdownResponse.OrderTypeData.builder()
                        .orderType(text(map, "orderType", "UNKNOWN"))
                        .count(integer(map.get("count")))
                        .sales(decimal(map.get("sales")))
                        .percentage(decimal(map.get("percentage")))
                        .averageOrderValue(decimal(map.get("averageOrderValue")))
                        .build());
            }
            return OrderTypeBreakdownResponse.builder()
                    .breakdown(breakdown)
                    .totalSales(decimal(summary.get("rangeSales")))
                    .totalOrders(integer(summary.get("rangeOrderCount")))
                    .build();
        }

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDate(today);

        // Group by order type
        Map<String, List<Map<String, Object>>> ordersByType = orders.stream()
            .collect(Collectors.groupingBy(o -> (String) o.getOrDefault("orderType", "UNKNOWN")));

        List<OrderTypeBreakdownResponse.OrderTypeData> breakdown = new ArrayList<>();
        BigDecimal totalSales = calculateTotalSales(orders);
        int totalOrders = orders.size();

        for (Map.Entry<String, List<Map<String, Object>>> entry : ordersByType.entrySet()) {
            String orderType = entry.getKey();
            List<Map<String, Object>> typeOrders = entry.getValue();

            int count = typeOrders.size();
            BigDecimal sales = calculateTotalSales(typeOrders);
            BigDecimal percentage = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? sales.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
            BigDecimal aov = count > 0
                ? sales.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            breakdown.add(OrderTypeBreakdownResponse.OrderTypeData.builder()
                .orderType(orderType)
                .count(count)
                .sales(sales)
                .percentage(percentage)
                .averageOrderValue(aov)
                .build());
        }

        // Sort by count descending
        breakdown.sort((a, b) -> Integer.compare(b.getCount(), a.getCount()));

        return OrderTypeBreakdownResponse.builder()
                .breakdown(breakdown)
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .build();
    }

    /**
     * Get peak hours analysis
     */
    @Cacheable(value = "peakHours", key = "'v2-' + #p0")
    public PeakHoursResponse getPeakHours(String storeId) {
        log.info("Calculating peak hours for store: {}", storeId);

        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, 30);
        if (hasSummary(summary) && summary.get("hours") instanceof List<?> hours && !hours.isEmpty()) {
            List<PeakHoursResponse.HourData> hourlyData = new ArrayList<>();
            int peakHour = 0;
            int peakHourOrders = 0;
            BigDecimal peakHourSales = BigDecimal.ZERO;
            int slowestHour = 0;
            int slowestHourOrders = Integer.MAX_VALUE;
            for (Object row : hours) {
                if (!(row instanceof Map<?, ?> map)) continue;
                int hour = integer(map.get("hour"));
                int orderCount = integer(map.get("orderCount"));
                BigDecimal sales = decimal(map.get("sales"));
                BigDecimal aov = orderCount > 0
                        ? sales.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                hourlyData.add(PeakHoursResponse.HourData.builder()
                        .hour(hour)
                        .label(String.format("%02d:00", hour))
                        .orderCount(orderCount)
                        .sales(sales)
                        .averageOrderValue(aov)
                        .build());
                if (orderCount > peakHourOrders) {
                    peakHour = hour;
                    peakHourOrders = orderCount;
                    peakHourSales = sales;
                }
                if (orderCount < slowestHourOrders) {
                    slowestHour = hour;
                    slowestHourOrders = orderCount;
                }
            }
            return PeakHoursResponse.builder()
                    .hourlyData(hourlyData)
                    .peakHour(peakHour)
                    .slowestHour(slowestHour)
                    .peakHourSales(peakHourSales)
                    .peakHourOrders(peakHourOrders)
                    .build();
        }

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDate(today);

        // Group by hour
        Map<Integer, List<Map<String, Object>>> ordersByHour = groupOrdersByHour(orders);

        List<PeakHoursResponse.HourData> hourlyData = new ArrayList<>();
        int peakHour = 0;
        int peakHourOrders = 0;
        BigDecimal peakHourSales = BigDecimal.ZERO;
        int slowestHour = 0;
        int slowestHourOrders = Integer.MAX_VALUE;

        for (int hour = 0; hour < 24; hour++) {
            List<Map<String, Object>> hourOrders = ordersByHour.getOrDefault(hour, Collections.emptyList());

            int orderCount = hourOrders.size();
            BigDecimal sales = calculateTotalSales(hourOrders);
            BigDecimal aov = orderCount > 0
                ? sales.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            String label = formatHourLabel(hour);

            hourlyData.add(PeakHoursResponse.HourData.builder()
                .hour(hour)
                .label(label)
                .orderCount(orderCount)
                .sales(sales)
                .averageOrderValue(aov)
                .build());

            // Track peak and slowest hours
            if (orderCount > peakHourOrders) {
                peakHour = hour;
                peakHourOrders = orderCount;
                peakHourSales = sales;
            }
            if (orderCount > 0 && orderCount < slowestHourOrders) {
                slowestHour = hour;
                slowestHourOrders = orderCount;
            }
        }

        return PeakHoursResponse.builder()
                .hourlyData(hourlyData)
                .peakHour(peakHour)
                .slowestHour(slowestHour)
                .peakHourSales(peakHourSales)
                .peakHourOrders(peakHourOrders)
                .build();
    }

    /**
     * Get staff leaderboard
     */
    @Cacheable(value = "staffLeaderboard", key = "'v2-' + #p0 + '-' + #p1")
    public StaffLeaderboardResponse getStaffLeaderboard(String storeId, String period) {
        log.info("Fetching staff leaderboard for store: {}, period: {}", storeId, period);

        int days = switch (period.toUpperCase()) {
            case "WEEK", "WEEKLY" -> 7;
            case "MONTH", "MONTHLY" -> 30;
            default -> 1;
        };
        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, Math.max(days, 7));
        if (hasSummary(summary) && summary.get("staff") instanceof List<?> staffRows && !staffRows.isEmpty()) {
            List<StaffLeaderboardResponse.StaffRanking> rankings = new ArrayList<>();
            for (Object row : staffRows) {
                if (!(row instanceof Map<?, ?> map)) continue;
                rankings.add(StaffLeaderboardResponse.StaffRanking.builder()
                        .rank(integer(map.get("rank")))
                        .staffId(text(map, "staffId", ""))
                        .staffName(text(map, "staffName", "Staff"))
                        .ordersProcessed(integer(map.get("ordersProcessed")))
                        .salesGenerated(decimal(map.get("salesGenerated")))
                        .averageOrderValue(decimal(map.get("averageOrderValue")))
                        .performanceLevel(text(map, "performanceLevel", "AVERAGE"))
                        .percentOfTotalSales(decimal(map.get("percentOfTotalSales")))
                        .build());
            }
            return StaffLeaderboardResponse.builder()
                    .rankings(rankings)
                    .period(period.toUpperCase())
                    .totalStaff(rankings.size())
                    .build();
        }

        // Europe/Berlin business calendar for EU primary
        LocalDate endDate = LocalDate.now(BUSINESS_ZONE);
        LocalDate startDate;

        switch (period.toUpperCase()) {
            case "WEEK":
                startDate = endDate.minusDays(6);
                break;
            case "MONTH":
                startDate = endDate.minusDays(29);
                break;
            default:
                startDate = endDate;
        }

        // Get all staff for the store
        List<Map<String, Object>> staffList = userServiceClient.getStaffByStore(storeId);
        log.debug("Found {} staff members for store {}", staffList.size(), storeId);

        // Fetch all orders in date range once
        List<Map<String, Object>> allOrders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(endDate, LocalTime.MAX)
        );
        log.debug("Fetched {} total orders for date range {} to {}", allOrders.size(), startDate, endDate);

        // Debug: Count orders with staff attribution
        long ordersWithStaff = allOrders.stream()
            .filter(o -> o.get("createdByStaffId") != null && !o.get("createdByStaffId").toString().isEmpty())
            .count();
        log.debug("Orders with createdByStaffId populated: {}", ordersWithStaff);

        // Debug: Count completed orders (what gets counted in sales)
        long completedOrders = allOrders.stream()
            .filter(this::isCompletedOrder)
            .count();
        log.debug("Completed orders (counted in analytics): {}", completedOrders);

        // Calculate performance for each staff member
        List<StaffLeaderboardResponse.StaffRanking> rankings = new ArrayList<>();
        BigDecimal totalSales = BigDecimal.ZERO;

        for (Map<String, Object> staff : staffList) {
            String staffId = (String) staff.get("id");
            String staffName = (String) staff.get("name");

            List<Map<String, Object>> staffOrders = allOrders.stream()
            .filter(o -> staffId.equals(o.get("createdByStaffId")))
            .collect(Collectors.toList());

            int ordersProcessed = staffOrders.size();
            BigDecimal salesGenerated = calculateTotalSales(staffOrders);
            totalSales = totalSales.add(salesGenerated);

            log.debug("Staff {}: {} total orders, {} completed orders, ₹{} sales",
                staffName, ordersProcessed,
                staffOrders.stream().filter(this::isCompletedOrder).count(),
                salesGenerated);

            BigDecimal aov = ordersProcessed > 0
                ? salesGenerated.divide(BigDecimal.valueOf(ordersProcessed), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            String performanceLevel = determinePerformanceLevel(ordersProcessed, salesGenerated);

            rankings.add(StaffLeaderboardResponse.StaffRanking.builder()
                .staffId(staffId)
                .staffName(staffName)
                .ordersProcessed(ordersProcessed)
                .salesGenerated(salesGenerated)
                .averageOrderValue(aov)
                .performanceLevel(performanceLevel)
                .build());
        }

        // Sort by sales generated (descending)
        rankings.sort((a, b) -> b.getSalesGenerated().compareTo(a.getSalesGenerated()));

        // Assign ranks and calculate percentages
        for (int i = 0; i < rankings.size(); i++) {
            StaffLeaderboardResponse.StaffRanking ranking = rankings.get(i);
            ranking.setRank(i + 1);

            BigDecimal percentage = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? ranking.getSalesGenerated().divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
            ranking.setPercentOfTotalSales(percentage);
        }

        return StaffLeaderboardResponse.builder()
                .rankings(rankings)
                .period(period.toUpperCase())
                .totalStaff(rankings.size())
                .build();
    }

    /**
     * Get top selling products
     */
    @Cacheable(value = "topProducts", key = "'v2-' + #p0 + '-' + #p1 + '-' + #p2")
    public TopProductsResponse getTopProducts(String storeId, String period, String sortBy) {
        log.info("Fetching top products for store: {}, period: {}, sortBy: {}", storeId, period, sortBy);

        int days = switch (period.toUpperCase()) {
            case "WEEK", "WEEKLY" -> 7;
            case "MONTH", "MONTHLY" -> 30;
            default -> 1;
        };
        Map<String, Object> summary = orderServiceClient.getStoreSummary(storeId, Math.max(days, 7));
        if (hasSummary(summary) && summary.get("topProducts") instanceof List<?> products && !products.isEmpty()) {
            List<TopProductsResponse.ProductData> topProducts = new ArrayList<>();
            for (Object row : products) {
                if (!(row instanceof Map<?, ?> map)) continue;
                topProducts.add(TopProductsResponse.ProductData.builder()
                        .rank(integer(map.get("rank")))
                        .itemId(text(map, "itemId", ""))
                        .itemName(text(map, "itemName", "Item"))
                        .category(text(map, "category", "FOOD"))
                        .quantitySold(integer(map.get("quantitySold")))
                        .revenue(decimal(map.get("revenue")))
                        .unitPrice(decimal(map.get("unitPrice")))
                        .percentOfTotalRevenue(decimal(map.get("percentOfTotalRevenue")))
                        .trend(text(map, "trend", "UP"))
                        .build());
            }
            if ("QUANTITY".equalsIgnoreCase(sortBy)) {
                topProducts.sort((a, b) -> Integer.compare(b.getQuantitySold(), a.getQuantitySold()));
            }
            return TopProductsResponse.builder()
                    .topProducts(topProducts)
                    .period(period)
                    .sortBy(sortBy)
                    .build();
        }

        LocalDate endDate = LocalDate.now(BUSINESS_ZONE);
        LocalDate startDate;

        switch (period.toUpperCase()) {
            case "WEEK":
                startDate = endDate.minusDays(6);
                break;
            case "MONTH":
                startDate = endDate.minusDays(29);
                break;
            default:
                startDate = endDate;
        }

        // Get all orders for the period
        List<Map<String, Object>> orders = orderServiceClient.getOrdersByDateRange(
            LocalDateTime.of(startDate, LocalTime.MIN),
            LocalDateTime.of(endDate, LocalTime.MAX)
        );

        // Extract and aggregate items from all orders
        Map<String, TopProductsResponse.ProductData.Builder> productAggregates = new HashMap<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Map<String, Object> order : orders) {
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
                    BigDecimal unitPrice = priceObj instanceof Number ? BigDecimal.valueOf(((Number) priceObj).doubleValue()) : BigDecimal.ZERO;
                    BigDecimal itemRevenue = unitPrice.multiply(BigDecimal.valueOf(quantity));

                    totalRevenue = totalRevenue.add(itemRevenue);

                    productAggregates.compute(itemId, (key, builder) -> {
                        if (builder == null) {
                            builder = TopProductsResponse.ProductData.builder()
                                .itemId(itemId)
                                .itemName(itemName)
                                .category(category)
                                .quantitySold(quantity)
                                .revenue(itemRevenue)
                                .unitPrice(unitPrice);
                        } else {
                            builder.quantitySold(builder.build().getQuantitySold() + quantity);
                            builder.revenue(builder.build().getRevenue().add(itemRevenue));
                        }
                        return builder;
                    });
                }
            }
        }

        // Build product list
        List<TopProductsResponse.ProductData> products = new ArrayList<>();
        final BigDecimal finalTotalRevenue = totalRevenue;

        productAggregates.forEach((itemId, builder) -> {
            TopProductsResponse.ProductData product = builder.build();

            BigDecimal percentage = finalTotalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? product.getRevenue().divide(finalTotalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

            product.setPercentOfTotalRevenue(percentage);
            product.setTrend("STABLE"); // TODO: Calculate trend by comparing with previous period

            products.add(product);
        });

        // Sort by quantity or revenue
        if ("REVENUE".equalsIgnoreCase(sortBy)) {
            products.sort((a, b) -> b.getRevenue().compareTo(a.getRevenue()));
        } else {
            products.sort((a, b) -> Integer.compare(b.getQuantitySold(), a.getQuantitySold()));
        }

        // Assign ranks and limit to top 20
        List<TopProductsResponse.ProductData> topProducts = products.stream()
            .limit(20)
            .collect(Collectors.toList());

        for (int i = 0; i < topProducts.size(); i++) {
            topProducts.get(i).setRank(i + 1);
        }

        return TopProductsResponse.builder()
                .topProducts(topProducts)
                .period(period.toUpperCase())
                .sortBy(sortBy.toUpperCase())
                .build();
    }

    // Additional helper methods

    private Map<LocalDate, List<Map<String, Object>>> groupOrdersByDate(List<Map<String, Object>> orders) {
        return orders.stream()
            .collect(Collectors.groupingBy(order -> {
                Object createdAtObj = order.get("createdAt");
                if (createdAtObj instanceof LocalDateTime) {
                    return ((LocalDateTime) createdAtObj).toLocalDate();
                }
                // Fallback to today if date is missing
                return LocalDate.now(BUSINESS_ZONE);
            }));
    }

    private Map<Integer, List<Map<String, Object>>> groupOrdersByHour(List<Map<String, Object>> orders) {
        return orders.stream()
            .collect(Collectors.groupingBy(order -> {
                Object createdAtObj = order.get("createdAt");
                if (createdAtObj instanceof LocalDateTime) {
                    return ((LocalDateTime) createdAtObj).getHour();
                }
                return 0; // Default to midnight if time is missing
            }));
    }

    private String formatHourLabel(int hour) {
        if (hour == 0) return "12 AM";
        if (hour < 12) return hour + " AM";
        if (hour == 12) return "12 PM";
        return (hour - 12) + " PM";
    }

    // ---------------------------------------------------------------
    // Event-driven ingestion (Phase 0 — called by AnalyticsEventListener)
    // Currently logs only; Phase 3 will persist to masova_analytics DB
    // ---------------------------------------------------------------

    public void recordOrderEvent(String orderId, String storeId, String customerId,
                                  String orderType, BigDecimal amount, String status) {
        log.info("Analytics event-ingest: order orderId={} storeId={} status={} amount={}",
                orderId, storeId, status, amount);
    }

    public void recordPaymentEvent(String paymentId, String orderId,
                                    BigDecimal amount, String paymentMethod, boolean success) {
        log.info("Analytics event-ingest: payment paymentId={} orderId={} method={} success={} amount={}",
                paymentId, orderId, paymentMethod, success, amount);
    }

    public void recordAggregatorOrderEvent(String orderId, String storeId, String platform,
                                            java.math.BigDecimal grossAmount,
                                            java.math.BigDecimal commissionAmount,
                                            java.math.BigDecimal netPayout,
                                            String currency) {
        // Log for now — full P&L is queried on demand from commerce-service
        log.info("[Analytics] Aggregator order recorded orderId={} storeId={} platform={} gross={} net={}",
                orderId, storeId, platform, grossAmount, netPayout);
        // Future: persist to analytics_aggregator_orders collection for cross-period reporting
    }
}
