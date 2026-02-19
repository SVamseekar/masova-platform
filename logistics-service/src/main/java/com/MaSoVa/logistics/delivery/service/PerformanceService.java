package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.DeliveryMetricsResponse;
import com.MaSoVa.logistics.delivery.dto.DriverPerformanceResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * Service for driver performance analytics
 */
@Service
public class PerformanceService {

    private static final Logger log = LoggerFactory.getLogger(PerformanceService.class);

    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final UserServiceClient userServiceClient;

    public PerformanceService(DeliveryTrackingRepository deliveryTrackingRepository, UserServiceClient userServiceClient) {
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.userServiceClient = userServiceClient;
    }

    /**
     * Get driver performance metrics for a date range
     * Week 4: Added storeId parameter for store isolation
     * Note: Caching temporarily disabled due to serialization issues with DriverPerformanceResponse
     */
    // @Cacheable(value = "performance", key = "#driverId + '-' + #storeId + '-' + #startDate + '-' + #endDate")
    public DriverPerformanceResponse getDriverPerformance(String driverId, String storeId, LocalDate startDate, LocalDate endDate) {
        log.info("Calculating performance for driver: {} in store: {} from {} to {}", driverId, storeId, startDate, endDate);

        // Get driver details
        Map<String, Object> driverDetails = userServiceClient.getDriverDetails(driverId);
        String driverName = driverDetails.get("name") != null ? (String) driverDetails.get("name") : "Unknown";

        // Get deliveries in date range filtered by storeId
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        List<DeliveryTracking> deliveries = deliveryTrackingRepository
                .findByDriverIdAndStoreIdAndCreatedAtBetween(driverId, storeId, start, end);

        // Calculate metrics
        int totalDeliveries = deliveries.size();
        long completedDeliveries = deliveries.stream()
                .filter(d -> "DELIVERED".equals(d.getStatus()))
                .count();
        long cancelledDeliveries = deliveries.stream()
                .filter(d -> "CANCELLED".equals(d.getStatus()))
                .count();

        BigDecimal completionRate = totalDeliveries > 0
                ? BigDecimal.valueOf(completedDeliveries * 100.0 / totalDeliveries).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Timing metrics
        List<DeliveryTracking> completed = deliveries.stream()
                .filter(d -> "DELIVERED".equals(d.getStatus()) && d.getActualDeliveryMinutes() != null)
                .toList();

        BigDecimal averageDeliveryTime = completed.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(
                        completed.stream()
                                .mapToInt(DeliveryTracking::getActualDeliveryMinutes)
                                .average()
                                .orElse(0.0)
                ).setScale(2, RoundingMode.HALF_UP);

        long onTimeDeliveries = completed.stream()
                .filter(d -> Boolean.TRUE.equals(d.getOnTime()))
                .count();

        long lateDeliveries = completed.size() - onTimeDeliveries;

        BigDecimal onTimePercentage = !completed.isEmpty()
                ? BigDecimal.valueOf(onTimeDeliveries * 100.0 / completed.size()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Distance metrics
        BigDecimal totalDistance = deliveries.stream()
                .filter(d -> d.getDistanceKm() != null)
                .map(DeliveryTracking::getDistanceKm)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageDistance = totalDeliveries > 0
                ? totalDistance.divide(BigDecimal.valueOf(totalDeliveries), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Financial metrics (20% commission)
        BigDecimal commissionRate = BigDecimal.valueOf(20.0);
        // In a real system, you'd fetch order amounts from Order Service
        BigDecimal totalEarnings = BigDecimal.valueOf(completedDeliveries * 50.0); // Placeholder
        BigDecimal averageEarningsPerDelivery = completedDeliveries > 0
                ? totalEarnings.divide(BigDecimal.valueOf(completedDeliveries), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Customer ratings
        List<DeliveryTracking> rated = deliveries.stream()
                .filter(d -> d.getCustomerRating() != null)
                .toList();

        double averageRating = rated.isEmpty()
                ? 0.0
                : rated.stream()
                        .mapToInt(DeliveryTracking::getCustomerRating)
                        .average()
                        .orElse(0.0);

        int fiveStars = (int) rated.stream().filter(d -> d.getCustomerRating() == 5).count();
        int fourStars = (int) rated.stream().filter(d -> d.getCustomerRating() == 4).count();
        int threeStars = (int) rated.stream().filter(d -> d.getCustomerRating() == 3).count();
        int twoStars = (int) rated.stream().filter(d -> d.getCustomerRating() == 2).count();
        int oneStars = (int) rated.stream().filter(d -> d.getCustomerRating() == 1).count();

        // Performance level
        String performanceLevel = determinePerformanceLevel(
                completionRate.doubleValue(),
                onTimePercentage.doubleValue(),
                averageRating
        );

        return DriverPerformanceResponse.builder()
                .driverId(driverId)
                .driverName(driverName)
                .startDate(startDate)
                .endDate(endDate)
                .totalDeliveries(totalDeliveries)
                .completedDeliveries((int) completedDeliveries)
                .cancelledDeliveries((int) cancelledDeliveries)
                .completionRate(completionRate)
                .averageDeliveryTime(averageDeliveryTime)
                .onTimeDeliveries((int) onTimeDeliveries)
                .lateDeliveries((int) lateDeliveries)
                .onTimePercentage(onTimePercentage)
                .totalDistanceKm(totalDistance)
                .averageDistancePerDelivery(averageDistance)
                .totalEarnings(totalEarnings)
                .commissionRate(commissionRate)
                .averageEarningsPerDelivery(averageEarningsPerDelivery)
                .averageRating(averageRating)
                .totalRatings(rated.size())
                .fiveStarCount(fiveStars)
                .fourStarCount(fourStars)
                .threeStarCount(threeStars)
                .twoStarCount(twoStars)
                .oneStarCount(oneStars)
                .performanceLevel(performanceLevel)
                .build();
    }

    private String determinePerformanceLevel(double completionRate, double onTimePercentage, double rating) {
        if (completionRate >= 95 && onTimePercentage >= 90 && rating >= 4.5) {
            return "EXCELLENT";
        } else if (completionRate >= 85 && onTimePercentage >= 75 && rating >= 4.0) {
            return "GOOD";
        } else if (completionRate >= 70 && onTimePercentage >= 60 && rating >= 3.5) {
            return "AVERAGE";
        } else {
            return "NEEDS_IMPROVEMENT";
        }
    }

    /**
     * Get today's overall delivery metrics
     * Week 4: Added storeId parameter for store isolation
     */
    public DeliveryMetricsResponse getTodayMetrics(String storeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = LocalDateTime.of(today, LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(today, LocalTime.MAX);

        log.info("Calculating today's delivery metrics for {} in store: {}", today, storeId);

        // Get all deliveries for today filtered by storeId
        List<DeliveryTracking> todayDeliveries = deliveryTrackingRepository
                .findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);

        // Calculate metrics
        int totalDeliveries = todayDeliveries.size();

        int activeDeliveries = (int) todayDeliveries.stream()
                .filter(d -> "ASSIGNED".equals(d.getStatus()) ||
                            "PICKED_UP".equals(d.getStatus()) ||
                            "OUT_FOR_DELIVERY".equals(d.getStatus()))
                .count();

        int completedDeliveries = (int) todayDeliveries.stream()
                .filter(d -> "DELIVERED".equals(d.getStatus()))
                .count();

        int cancelledDeliveries = (int) todayDeliveries.stream()
                .filter(d -> "CANCELLED".equals(d.getStatus()))
                .count();

        // Calculate average delivery time
        List<DeliveryTracking> completed = todayDeliveries.stream()
                .filter(d -> "DELIVERED".equals(d.getStatus()) && d.getActualDeliveryMinutes() != null)
                .toList();

        BigDecimal averageDeliveryTime = completed.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(
                        completed.stream()
                                .mapToInt(DeliveryTracking::getActualDeliveryMinutes)
                                .average()
                                .orElse(0.0)
                ).setScale(2, RoundingMode.HALF_UP);

        // Calculate average delivery distance
        BigDecimal totalDistance = todayDeliveries.stream()
                .filter(d -> d.getDistanceKm() != null)
                .map(DeliveryTracking::getDistanceKm)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageDistance = totalDeliveries > 0
                ? totalDistance.divide(BigDecimal.valueOf(totalDeliveries), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate on-time delivery rate
        long onTimeDeliveries = completed.stream()
                .filter(d -> Boolean.TRUE.equals(d.getOnTime()))
                .count();

        BigDecimal onTimeRate = !completed.isEmpty()
                ? BigDecimal.valueOf(onTimeDeliveries * 100.0 / completed.size()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate customer satisfaction rate (average rating)
        List<DeliveryTracking> rated = todayDeliveries.stream()
                .filter(d -> d.getCustomerRating() != null)
                .toList();

        BigDecimal satisfactionRate = rated.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(
                        rated.stream()
                                .mapToInt(DeliveryTracking::getCustomerRating)
                                .average()
                                .orElse(0.0)
                ).setScale(2, RoundingMode.HALF_UP);

        return new DeliveryMetricsResponse(
                totalDeliveries,
                activeDeliveries,
                completedDeliveries,
                cancelledDeliveries,
                averageDeliveryTime,
                averageDistance,
                onTimeRate,
                satisfactionRate
        );
    }
}
