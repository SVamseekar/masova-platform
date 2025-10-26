package com.MaSoVa.delivery.service;

import com.MaSoVa.delivery.client.UserServiceClient;
import com.MaSoVa.delivery.dto.DriverPerformanceResponse;
import com.MaSoVa.delivery.entity.DeliveryTracking;
import com.MaSoVa.delivery.repository.DeliveryTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Service for driver performance analytics
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PerformanceService {

    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final UserServiceClient userServiceClient;

    /**
     * Get driver performance metrics for a date range
     */
    @Cacheable(value = "performance", key = "#driverId + '-' + #startDate + '-' + #endDate")
    public DriverPerformanceResponse getDriverPerformance(String driverId, LocalDate startDate, LocalDate endDate) {
        log.info("Calculating performance for driver: {} from {} to {}", driverId, startDate, endDate);

        // Get driver details
        Map<String, Object> driverDetails = userServiceClient.getDriverDetails(driverId);
        String driverName = driverDetails.get("name") != null ? (String) driverDetails.get("name") : "Unknown";

        // Get deliveries in date range
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        List<DeliveryTracking> deliveries = deliveryTrackingRepository
                .findByDriverIdAndCreatedAtBetween(driverId, start, end);

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
}
