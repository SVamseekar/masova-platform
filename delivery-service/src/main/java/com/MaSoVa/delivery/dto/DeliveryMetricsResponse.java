package com.MaSoVa.delivery.dto;

import java.math.BigDecimal;

/**
 * DTO for overall delivery metrics
 */
public class DeliveryMetricsResponse {

    private Integer totalDeliveries;
    private Integer activeDeliveries;
    private Integer completedDeliveries;
    private Integer cancelledDeliveries;
    private BigDecimal averageDeliveryTime; // in minutes
    private BigDecimal averageDeliveryDistance; // in kilometers
    private BigDecimal onTimeDeliveryRate; // percentage
    private BigDecimal customerSatisfactionRate; // rating out of 5.0

    public DeliveryMetricsResponse() {
    }

    public DeliveryMetricsResponse(Integer totalDeliveries, Integer activeDeliveries, Integer completedDeliveries,
                                  Integer cancelledDeliveries, BigDecimal averageDeliveryTime,
                                  BigDecimal averageDeliveryDistance, BigDecimal onTimeDeliveryRate,
                                  BigDecimal customerSatisfactionRate) {
        this.totalDeliveries = totalDeliveries;
        this.activeDeliveries = activeDeliveries;
        this.completedDeliveries = completedDeliveries;
        this.cancelledDeliveries = cancelledDeliveries;
        this.averageDeliveryTime = averageDeliveryTime;
        this.averageDeliveryDistance = averageDeliveryDistance;
        this.onTimeDeliveryRate = onTimeDeliveryRate;
        this.customerSatisfactionRate = customerSatisfactionRate;
    }

    public Integer getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(Integer totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public Integer getActiveDeliveries() {
        return activeDeliveries;
    }

    public void setActiveDeliveries(Integer activeDeliveries) {
        this.activeDeliveries = activeDeliveries;
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

    public BigDecimal getAverageDeliveryTime() {
        return averageDeliveryTime;
    }

    public void setAverageDeliveryTime(BigDecimal averageDeliveryTime) {
        this.averageDeliveryTime = averageDeliveryTime;
    }

    public BigDecimal getAverageDeliveryDistance() {
        return averageDeliveryDistance;
    }

    public void setAverageDeliveryDistance(BigDecimal averageDeliveryDistance) {
        this.averageDeliveryDistance = averageDeliveryDistance;
    }

    public BigDecimal getOnTimeDeliveryRate() {
        return onTimeDeliveryRate;
    }

    public void setOnTimeDeliveryRate(BigDecimal onTimeDeliveryRate) {
        this.onTimeDeliveryRate = onTimeDeliveryRate;
    }

    public BigDecimal getCustomerSatisfactionRate() {
        return customerSatisfactionRate;
    }

    public void setCustomerSatisfactionRate(BigDecimal customerSatisfactionRate) {
        this.customerSatisfactionRate = customerSatisfactionRate;
    }
}
