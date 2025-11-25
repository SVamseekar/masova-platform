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
public class ReviewStatsResponse {

    private Long totalReviews;
    private Double averageRating;
    private Map<Integer, Long> ratingDistribution; // 1-5 stars count

    // Average specific ratings
    private Double averageFoodQualityRating;
    private Double averageServiceRating;
    private Double averageDeliveryRating;

    // Sentiment breakdown
    private Long positiveReviews;
    private Long neutralReviews;
    private Long negativeReviews;

    // Recent trends
    private Double recentTrendPercentage; // Trend compared to previous period
    private String trendDirection; // UP, DOWN, STABLE
}
