package com.MaSoVa.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for ETA calculation
 */
public class ETAResponse {

    private String orderId;
    private Integer estimatedMinutes;
    private LocalDateTime estimatedArrival;
    private BigDecimal distanceRemainingKm;
    private String status; // ON_TIME, DELAYED, ARRIVED
    private LocalDateTime calculatedAt;

    // Traffic consideration
    private String trafficCondition; // LIGHT, MODERATE, HEAVY
    private Integer trafficDelayMinutes;

    public ETAResponse() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public LocalDateTime getEstimatedArrival() {
        return estimatedArrival;
    }

    public void setEstimatedArrival(LocalDateTime estimatedArrival) {
        this.estimatedArrival = estimatedArrival;
    }

    public BigDecimal getDistanceRemainingKm() {
        return distanceRemainingKm;
    }

    public void setDistanceRemainingKm(BigDecimal distanceRemainingKm) {
        this.distanceRemainingKm = distanceRemainingKm;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }

    public String getTrafficCondition() {
        return trafficCondition;
    }

    public void setTrafficCondition(String trafficCondition) {
        this.trafficCondition = trafficCondition;
    }

    public Integer getTrafficDelayMinutes() {
        return trafficDelayMinutes;
    }

    public void setTrafficDelayMinutes(Integer trafficDelayMinutes) {
        this.trafficDelayMinutes = trafficDelayMinutes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private Integer estimatedMinutes;
        private LocalDateTime estimatedArrival;
        private BigDecimal distanceRemainingKm;
        private String status;
        private LocalDateTime calculatedAt;
        private String trafficCondition;
        private Integer trafficDelayMinutes;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder estimatedMinutes(Integer estimatedMinutes) {
            this.estimatedMinutes = estimatedMinutes;
            return this;
        }

        public Builder estimatedArrival(LocalDateTime estimatedArrival) {
            this.estimatedArrival = estimatedArrival;
            return this;
        }

        public Builder distanceRemainingKm(BigDecimal distanceRemainingKm) {
            this.distanceRemainingKm = distanceRemainingKm;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder calculatedAt(LocalDateTime calculatedAt) {
            this.calculatedAt = calculatedAt;
            return this;
        }

        public Builder trafficCondition(String trafficCondition) {
            this.trafficCondition = trafficCondition;
            return this;
        }

        public Builder trafficDelayMinutes(Integer trafficDelayMinutes) {
            this.trafficDelayMinutes = trafficDelayMinutes;
            return this;
        }

        public ETAResponse build() {
            ETAResponse response = new ETAResponse();
            response.orderId = this.orderId;
            response.estimatedMinutes = this.estimatedMinutes;
            response.estimatedArrival = this.estimatedArrival;
            response.distanceRemainingKm = this.distanceRemainingKm;
            response.status = this.status;
            response.calculatedAt = this.calculatedAt;
            response.trafficCondition = this.trafficCondition;
            response.trafficDelayMinutes = this.trafficDelayMinutes;
            return response;
        }
    }
}
