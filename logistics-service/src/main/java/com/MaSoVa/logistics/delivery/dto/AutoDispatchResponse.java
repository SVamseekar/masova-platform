package com.MaSoVa.logistics.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for auto-dispatch results
 */
public class AutoDispatchResponse {

    private String orderId;
    private String driverId;
    private String driverName;
    private String driverPhone;
    private BigDecimal distanceToPickup; // in kilometers
    private Integer estimatedPickupTime; // in minutes
    private Integer estimatedDeliveryTime; // in minutes
    private LocalDateTime assignedAt;
    private String dispatchMethod; // AUTO, MANUAL
    private String status; // ASSIGNED, ACCEPTED, REJECTED

    public AutoDispatchResponse() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
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

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public BigDecimal getDistanceToPickup() {
        return distanceToPickup;
    }

    public void setDistanceToPickup(BigDecimal distanceToPickup) {
        this.distanceToPickup = distanceToPickup;
    }

    public Integer getEstimatedPickupTime() {
        return estimatedPickupTime;
    }

    public void setEstimatedPickupTime(Integer estimatedPickupTime) {
        this.estimatedPickupTime = estimatedPickupTime;
    }

    public Integer getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(Integer estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public String getDispatchMethod() {
        return dispatchMethod;
    }

    public void setDispatchMethod(String dispatchMethod) {
        this.dispatchMethod = dispatchMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private String driverId;
        private String driverName;
        private String driverPhone;
        private BigDecimal distanceToPickup;
        private Integer estimatedPickupTime;
        private Integer estimatedDeliveryTime;
        private LocalDateTime assignedAt;
        private String dispatchMethod;
        private String status;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder driverId(String driverId) {
            this.driverId = driverId;
            return this;
        }

        public Builder driverName(String driverName) {
            this.driverName = driverName;
            return this;
        }

        public Builder driverPhone(String driverPhone) {
            this.driverPhone = driverPhone;
            return this;
        }

        public Builder distanceToPickup(BigDecimal distanceToPickup) {
            this.distanceToPickup = distanceToPickup;
            return this;
        }

        public Builder estimatedPickupTime(Integer estimatedPickupTime) {
            this.estimatedPickupTime = estimatedPickupTime;
            return this;
        }

        public Builder estimatedDeliveryTime(Integer estimatedDeliveryTime) {
            this.estimatedDeliveryTime = estimatedDeliveryTime;
            return this;
        }

        public Builder assignedAt(LocalDateTime assignedAt) {
            this.assignedAt = assignedAt;
            return this;
        }

        public Builder dispatchMethod(String dispatchMethod) {
            this.dispatchMethod = dispatchMethod;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public AutoDispatchResponse build() {
            AutoDispatchResponse response = new AutoDispatchResponse();
            response.orderId = this.orderId;
            response.driverId = this.driverId;
            response.driverName = this.driverName;
            response.driverPhone = this.driverPhone;
            response.distanceToPickup = this.distanceToPickup;
            response.estimatedPickupTime = this.estimatedPickupTime;
            response.estimatedDeliveryTime = this.estimatedDeliveryTime;
            response.assignedAt = this.assignedAt;
            response.dispatchMethod = this.dispatchMethod;
            response.status = this.status;
            return response;
        }
    }
}
