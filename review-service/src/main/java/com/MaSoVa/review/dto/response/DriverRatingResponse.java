package com.MaSoVa.review.dto.response;

import java.util.Map;

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

    // Constructors
    public DriverRatingResponse() {}

    // Getters and Setters
    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) { this.ratingDistribution = ratingDistribution; }

    public Double getAverageDeliveryRating() { return averageDeliveryRating; }
    public void setAverageDeliveryRating(Double averageDeliveryRating) { this.averageDeliveryRating = averageDeliveryRating; }

    public Double getAverageProfessionalismRating() { return averageProfessionalismRating; }
    public void setAverageProfessionalismRating(Double averageProfessionalismRating) { this.averageProfessionalismRating = averageProfessionalismRating; }

    public Long getPositiveReviews() { return positiveReviews; }
    public void setPositiveReviews(Long positiveReviews) { this.positiveReviews = positiveReviews; }

    public Long getNegativeReviews() { return negativeReviews; }
    public void setNegativeReviews(Long negativeReviews) { this.negativeReviews = negativeReviews; }

    public Double getLast30DaysRating() { return last30DaysRating; }
    public void setLast30DaysRating(Double last30DaysRating) { this.last30DaysRating = last30DaysRating; }

    public String getPerformanceTrend() { return performanceTrend; }
    public void setPerformanceTrend(String performanceTrend) { this.performanceTrend = performanceTrend; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final DriverRatingResponse response = new DriverRatingResponse();

        public Builder driverId(String driverId) { response.driverId = driverId; return this; }
        public Builder driverName(String driverName) { response.driverName = driverName; return this; }
        public Builder totalReviews(Long totalReviews) { response.totalReviews = totalReviews; return this; }
        public Builder averageRating(Double averageRating) { response.averageRating = averageRating; return this; }
        public Builder ratingDistribution(Map<Integer, Long> ratingDistribution) { response.ratingDistribution = ratingDistribution; return this; }
        public Builder averageDeliveryRating(Double averageDeliveryRating) { response.averageDeliveryRating = averageDeliveryRating; return this; }
        public Builder averageProfessionalismRating(Double averageProfessionalismRating) { response.averageProfessionalismRating = averageProfessionalismRating; return this; }
        public Builder positiveReviews(Long positiveReviews) { response.positiveReviews = positiveReviews; return this; }
        public Builder negativeReviews(Long negativeReviews) { response.negativeReviews = negativeReviews; return this; }
        public Builder last30DaysRating(Double last30DaysRating) { response.last30DaysRating = last30DaysRating; return this; }
        public Builder performanceTrend(String performanceTrend) { response.performanceTrend = performanceTrend; return this; }

        public DriverRatingResponse build() { return response; }
    }
}
