package com.MaSoVa.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverRatingResponse {

    private String driverId;
    private String driverName;

    private Long totalReviews;
    private Double averageRating;
    private Map<Integer, Long> ratingDistribution;

    // Performance metrics
    private Double averageDeliveryRating;
    private Double averageProfessionalismRating;

    private Long positiveReviews;
    private Long negativeReviews;

    // Recent performance
    private Double last30DaysRating;
    private String performanceTrend; // IMPROVING, DECLINING, STABLE
}
