package com.MaSoVa.review.dto.response;

import java.util.Map;

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

    // Constructors
    public ReviewStatsResponse() {}

    // Getters and Setters
    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) { this.ratingDistribution = ratingDistribution; }

    public Double getAverageFoodQualityRating() { return averageFoodQualityRating; }
    public void setAverageFoodQualityRating(Double averageFoodQualityRating) { this.averageFoodQualityRating = averageFoodQualityRating; }

    public Double getAverageServiceRating() { return averageServiceRating; }
    public void setAverageServiceRating(Double averageServiceRating) { this.averageServiceRating = averageServiceRating; }

    public Double getAverageDeliveryRating() { return averageDeliveryRating; }
    public void setAverageDeliveryRating(Double averageDeliveryRating) { this.averageDeliveryRating = averageDeliveryRating; }

    public Long getPositiveReviews() { return positiveReviews; }
    public void setPositiveReviews(Long positiveReviews) { this.positiveReviews = positiveReviews; }

    public Long getNeutralReviews() { return neutralReviews; }
    public void setNeutralReviews(Long neutralReviews) { this.neutralReviews = neutralReviews; }

    public Long getNegativeReviews() { return negativeReviews; }
    public void setNegativeReviews(Long negativeReviews) { this.negativeReviews = negativeReviews; }

    public Double getRecentTrendPercentage() { return recentTrendPercentage; }
    public void setRecentTrendPercentage(Double recentTrendPercentage) { this.recentTrendPercentage = recentTrendPercentage; }

    public String getTrendDirection() { return trendDirection; }
    public void setTrendDirection(String trendDirection) { this.trendDirection = trendDirection; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final ReviewStatsResponse response = new ReviewStatsResponse();

        public Builder totalReviews(Long totalReviews) { response.totalReviews = totalReviews; return this; }
        public Builder averageRating(Double averageRating) { response.averageRating = averageRating; return this; }
        public Builder ratingDistribution(Map<Integer, Long> ratingDistribution) { response.ratingDistribution = ratingDistribution; return this; }
        public Builder averageFoodQualityRating(Double averageFoodQualityRating) { response.averageFoodQualityRating = averageFoodQualityRating; return this; }
        public Builder averageServiceRating(Double averageServiceRating) { response.averageServiceRating = averageServiceRating; return this; }
        public Builder averageDeliveryRating(Double averageDeliveryRating) { response.averageDeliveryRating = averageDeliveryRating; return this; }
        public Builder positiveReviews(Long positiveReviews) { response.positiveReviews = positiveReviews; return this; }
        public Builder neutralReviews(Long neutralReviews) { response.neutralReviews = neutralReviews; return this; }
        public Builder negativeReviews(Long negativeReviews) { response.negativeReviews = negativeReviews; return this; }
        public Builder recentTrendPercentage(Double recentTrendPercentage) { response.recentTrendPercentage = recentTrendPercentage; return this; }
        public Builder trendDirection(String trendDirection) { response.trendDirection = trendDirection; return this; }

        public ReviewStatsResponse build() { return response; }
    }
}
