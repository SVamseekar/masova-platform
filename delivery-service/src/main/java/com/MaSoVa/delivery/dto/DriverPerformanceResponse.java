package com.MaSoVa.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response DTO for driver performance analytics
 */
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

    public DriverPerformanceResponse() {
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(Integer totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public Integer getCompletedDeliveries() {
        return completedDeliveries;
    }

    public void setCompletedDeliveries(Integer completedDeliveries) {
        this.completedDeliveries = completedDeliveries;
    }

    public Integer getCancelledDeliveries() {
        return cancelledDeliveries;
    }

    public void setCancelledDeliveries(Integer cancelledDeliveries) {
        this.cancelledDeliveries = cancelledDeliveries;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getAverageDeliveryTime() {
        return averageDeliveryTime;
    }

    public void setAverageDeliveryTime(BigDecimal averageDeliveryTime) {
        this.averageDeliveryTime = averageDeliveryTime;
    }

    public Integer getOnTimeDeliveries() {
        return onTimeDeliveries;
    }

    public void setOnTimeDeliveries(Integer onTimeDeliveries) {
        this.onTimeDeliveries = onTimeDeliveries;
    }

    public Integer getLateDeliveries() {
        return lateDeliveries;
    }

    public void setLateDeliveries(Integer lateDeliveries) {
        this.lateDeliveries = lateDeliveries;
    }

    public BigDecimal getOnTimePercentage() {
        return onTimePercentage;
    }

    public void setOnTimePercentage(BigDecimal onTimePercentage) {
        this.onTimePercentage = onTimePercentage;
    }

    public BigDecimal getTotalDistanceKm() {
        return totalDistanceKm;
    }

    public void setTotalDistanceKm(BigDecimal totalDistanceKm) {
        this.totalDistanceKm = totalDistanceKm;
    }

    public BigDecimal getAverageDistancePerDelivery() {
        return averageDistancePerDelivery;
    }

    public void setAverageDistancePerDelivery(BigDecimal averageDistancePerDelivery) {
        this.averageDistancePerDelivery = averageDistancePerDelivery;
    }

    public BigDecimal getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(BigDecimal totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(BigDecimal commissionRate) {
        this.commissionRate = commissionRate;
    }

    public BigDecimal getAverageEarningsPerDelivery() {
        return averageEarningsPerDelivery;
    }

    public void setAverageEarningsPerDelivery(BigDecimal averageEarningsPerDelivery) {
        this.averageEarningsPerDelivery = averageEarningsPerDelivery;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Integer totalRatings) {
        this.totalRatings = totalRatings;
    }

    public Integer getFiveStarCount() {
        return fiveStarCount;
    }

    public void setFiveStarCount(Integer fiveStarCount) {
        this.fiveStarCount = fiveStarCount;
    }

    public Integer getFourStarCount() {
        return fourStarCount;
    }

    public void setFourStarCount(Integer fourStarCount) {
        this.fourStarCount = fourStarCount;
    }

    public Integer getThreeStarCount() {
        return threeStarCount;
    }

    public void setThreeStarCount(Integer threeStarCount) {
        this.threeStarCount = threeStarCount;
    }

    public Integer getTwoStarCount() {
        return twoStarCount;
    }

    public void setTwoStarCount(Integer twoStarCount) {
        this.twoStarCount = twoStarCount;
    }

    public Integer getOneStarCount() {
        return oneStarCount;
    }

    public void setOneStarCount(Integer oneStarCount) {
        this.oneStarCount = oneStarCount;
    }

    public String getPerformanceLevel() {
        return performanceLevel;
    }

    public void setPerformanceLevel(String performanceLevel) {
        this.performanceLevel = performanceLevel;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String driverId;
        private String driverName;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDeliveries;
        private Integer completedDeliveries;
        private Integer cancelledDeliveries;
        private BigDecimal completionRate;
        private BigDecimal averageDeliveryTime;
        private Integer onTimeDeliveries;
        private Integer lateDeliveries;
        private BigDecimal onTimePercentage;
        private BigDecimal totalDistanceKm;
        private BigDecimal averageDistancePerDelivery;
        private BigDecimal totalEarnings;
        private BigDecimal commissionRate;
        private BigDecimal averageEarningsPerDelivery;
        private Double averageRating;
        private Integer totalRatings;
        private Integer fiveStarCount;
        private Integer fourStarCount;
        private Integer threeStarCount;
        private Integer twoStarCount;
        private Integer oneStarCount;
        private String performanceLevel;

        public Builder driverId(String driverId) {
            this.driverId = driverId;
            return this;
        }

        public Builder driverName(String driverName) {
            this.driverName = driverName;
            return this;
        }

        public Builder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public Builder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public Builder totalDeliveries(Integer totalDeliveries) {
            this.totalDeliveries = totalDeliveries;
            return this;
        }

        public Builder completedDeliveries(Integer completedDeliveries) {
            this.completedDeliveries = completedDeliveries;
            return this;
        }

        public Builder cancelledDeliveries(Integer cancelledDeliveries) {
            this.cancelledDeliveries = cancelledDeliveries;
            return this;
        }

        public Builder completionRate(BigDecimal completionRate) {
            this.completionRate = completionRate;
            return this;
        }

        public Builder averageDeliveryTime(BigDecimal averageDeliveryTime) {
            this.averageDeliveryTime = averageDeliveryTime;
            return this;
        }

        public Builder onTimeDeliveries(Integer onTimeDeliveries) {
            this.onTimeDeliveries = onTimeDeliveries;
            return this;
        }

        public Builder lateDeliveries(Integer lateDeliveries) {
            this.lateDeliveries = lateDeliveries;
            return this;
        }

        public Builder onTimePercentage(BigDecimal onTimePercentage) {
            this.onTimePercentage = onTimePercentage;
            return this;
        }

        public Builder totalDistanceKm(BigDecimal totalDistanceKm) {
            this.totalDistanceKm = totalDistanceKm;
            return this;
        }

        public Builder averageDistancePerDelivery(BigDecimal averageDistancePerDelivery) {
            this.averageDistancePerDelivery = averageDistancePerDelivery;
            return this;
        }

        public Builder totalEarnings(BigDecimal totalEarnings) {
            this.totalEarnings = totalEarnings;
            return this;
        }

        public Builder commissionRate(BigDecimal commissionRate) {
            this.commissionRate = commissionRate;
            return this;
        }

        public Builder averageEarningsPerDelivery(BigDecimal averageEarningsPerDelivery) {
            this.averageEarningsPerDelivery = averageEarningsPerDelivery;
            return this;
        }

        public Builder averageRating(Double averageRating) {
            this.averageRating = averageRating;
            return this;
        }

        public Builder totalRatings(Integer totalRatings) {
            this.totalRatings = totalRatings;
            return this;
        }

        public Builder fiveStarCount(Integer fiveStarCount) {
            this.fiveStarCount = fiveStarCount;
            return this;
        }

        public Builder fourStarCount(Integer fourStarCount) {
            this.fourStarCount = fourStarCount;
            return this;
        }

        public Builder threeStarCount(Integer threeStarCount) {
            this.threeStarCount = threeStarCount;
            return this;
        }

        public Builder twoStarCount(Integer twoStarCount) {
            this.twoStarCount = twoStarCount;
            return this;
        }

        public Builder oneStarCount(Integer oneStarCount) {
            this.oneStarCount = oneStarCount;
            return this;
        }

        public Builder performanceLevel(String performanceLevel) {
            this.performanceLevel = performanceLevel;
            return this;
        }

        public DriverPerformanceResponse build() {
            DriverPerformanceResponse response = new DriverPerformanceResponse();
            response.driverId = this.driverId;
            response.driverName = this.driverName;
            response.startDate = this.startDate;
            response.endDate = this.endDate;
            response.totalDeliveries = this.totalDeliveries;
            response.completedDeliveries = this.completedDeliveries;
            response.cancelledDeliveries = this.cancelledDeliveries;
            response.completionRate = this.completionRate;
            response.averageDeliveryTime = this.averageDeliveryTime;
            response.onTimeDeliveries = this.onTimeDeliveries;
            response.lateDeliveries = this.lateDeliveries;
            response.onTimePercentage = this.onTimePercentage;
            response.totalDistanceKm = this.totalDistanceKm;
            response.averageDistancePerDelivery = this.averageDistancePerDelivery;
            response.totalEarnings = this.totalEarnings;
            response.commissionRate = this.commissionRate;
            response.averageEarningsPerDelivery = this.averageEarningsPerDelivery;
            response.averageRating = this.averageRating;
            response.totalRatings = this.totalRatings;
            response.fiveStarCount = this.fiveStarCount;
            response.fourStarCount = this.fourStarCount;
            response.threeStarCount = this.threeStarCount;
            response.twoStarCount = this.twoStarCount;
            response.oneStarCount = this.oneStarCount;
            response.performanceLevel = this.performanceLevel;
            return response;
        }
    }
}
