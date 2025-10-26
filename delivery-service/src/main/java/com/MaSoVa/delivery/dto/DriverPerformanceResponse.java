package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response DTO for driver performance analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverPerformanceResponse {

    private String driverId;
    private String driverName;
    private LocalDate startDate;
    private LocalDate endDate;

    // Delivery metrics
    private Integer totalDeliveries;
    private Integer completedDeliveries;
    private Integer cancelledDeliveries;
    private BigDecimal completionRate; // Percentage

    // Timing metrics
    private BigDecimal averageDeliveryTime; // In minutes
    private Integer onTimeDeliveries;
    private Integer lateDeliveries;
    private BigDecimal onTimePercentage;

    // Distance metrics
    private BigDecimal totalDistanceKm;
    private BigDecimal averageDistancePerDelivery;

    // Financial metrics
    private BigDecimal totalEarnings;
    private BigDecimal commissionRate; // Percentage
    private BigDecimal averageEarningsPerDelivery;

    // Customer satisfaction
    private Double averageRating;
    private Integer totalRatings;
    private Integer fiveStarCount;
    private Integer fourStarCount;
    private Integer threeStarCount;
    private Integer twoStarCount;
    private Integer oneStarCount;

    // Performance level
    private String performanceLevel; // EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT
}
