package com.MaSoVa.analytics.service;

import com.MaSoVa.analytics.client.OrderServiceClient;
import com.MaSoVa.analytics.client.UserServiceClient;
import com.MaSoVa.analytics.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderServiceClient orderServiceClient;
    private final UserServiceClient userServiceClient;

    /**
     * Get sales metrics for today compared to yesterday and last year
     */
    @Cacheable(value = "salesMetrics", key = "#storeId")
    public SalesMetricsResponse getTodaySalesMetrics(String storeId) {
        log.info("Calculating sales metrics for store: {}", storeId);

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate lastYear = today.minusYears(1);
        LocalTime currentTime = LocalTime.now();

        // Get today's orders
        List<Map<String, Object>> todayOrders = orderServiceClient.getOrdersByDate(today);
        BigDecimal todaySales = calculateTotalSales(todayOrders);
        int todayOrderCount = todayOrders.size();

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
    @Cacheable(value = "salesMetrics", key = "'aov-' + #storeId")
    public AverageOrderValueResponse getAverageOrderValue(String storeId) {
        log.info("Calculating average order value for store: {}", storeId);

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Get today's orders
        List<Map<String, Object>> todayOrders = orderServiceClient.getOrdersByDate(today);
        BigDecimal todaySales = calculateTotalSales(todayOrders);
        int todayOrderCount = todayOrders.size();
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
    @Cacheable(value = "driverStatus", key = "#storeId")
    public DriverStatusResponse getDriverStatus(String storeId) {
        log.info("Fetching driver status for store: {}", storeId);

        List<Map<String, Object>> drivers = userServiceClient.getDriversByStore(storeId);

        int totalDrivers = drivers.size();
        long availableDrivers = drivers.stream()
                .filter(d -> "AVAILABLE".equals(d.get("status")))
                .count();
        long busyDrivers = drivers.stream()
                .filter(d -> "BUSY".equals(d.get("status")))
                .count();

        Integer activeDeliveries = orderServiceClient.getActiveDeliveryCount();

        // Calculate completed deliveries today
        LocalDate today = LocalDate.now();
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
    @Cacheable(value = "staffPerformance", key = "#staffId")
    public StaffPerformanceResponse getStaffPerformance(String staffId) {
        log.info("Fetching staff performance for: {}", staffId);

        LocalDate today = LocalDate.now();
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

    private BigDecimal calculateTotalSales(List<Map<String, Object>> orders) {
        return orders.stream()
                .map(order -> {
                    Object totalAmountObj = order.get("totalAmount");
                    if (totalAmountObj instanceof Number) {
                        return BigDecimal.valueOf(((Number) totalAmountObj).doubleValue());
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
}
