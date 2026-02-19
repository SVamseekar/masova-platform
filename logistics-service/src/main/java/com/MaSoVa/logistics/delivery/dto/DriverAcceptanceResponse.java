package com.MaSoVa.logistics.delivery.dto;

import java.time.LocalDateTime;

/**
 * DTO for driver acceptance/rejection response
 * DELIV-003: Driver Acceptance Flow
 */
public class DriverAcceptanceResponse {

    private String trackingId;
    private String orderId;
    private String status;
    private String driverId;
    private String driverName;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private Integer estimatedPickupMinutes;
    private Integer estimatedDeliveryMinutes;
    private boolean reassignmentTriggered;
    private String newDriverId;
    private String message;

    public DriverAcceptanceResponse() {
    }

    // Builder pattern for response construction
    public static Builder builder() {
        return new Builder();
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Integer getEstimatedPickupMinutes() {
        return estimatedPickupMinutes;
    }

    public void setEstimatedPickupMinutes(Integer estimatedPickupMinutes) {
        this.estimatedPickupMinutes = estimatedPickupMinutes;
    }

    public Integer getEstimatedDeliveryMinutes() {
        return estimatedDeliveryMinutes;
    }

    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
        this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
    }

    public boolean isReassignmentTriggered() {
        return reassignmentTriggered;
    }

    public void setReassignmentTriggered(boolean reassignmentTriggered) {
        this.reassignmentTriggered = reassignmentTriggered;
    }

    public String getNewDriverId() {
        return newDriverId;
    }

    public void setNewDriverId(String newDriverId) {
        this.newDriverId = newDriverId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public static class Builder {
        private String trackingId;
        private String orderId;
        private String status;
        private String driverId;
        private String driverName;
        private LocalDateTime acceptedAt;
        private LocalDateTime rejectedAt;
        private String rejectionReason;
        private Integer estimatedPickupMinutes;
        private Integer estimatedDeliveryMinutes;
        private boolean reassignmentTriggered;
        private String newDriverId;
        private String message;

        public Builder trackingId(String trackingId) {
            this.trackingId = trackingId;
            return this;
        }

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
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

        public Builder acceptedAt(LocalDateTime acceptedAt) {
            this.acceptedAt = acceptedAt;
            return this;
        }

        public Builder rejectedAt(LocalDateTime rejectedAt) {
            this.rejectedAt = rejectedAt;
            return this;
        }

        public Builder rejectionReason(String rejectionReason) {
            this.rejectionReason = rejectionReason;
            return this;
        }

        public Builder estimatedPickupMinutes(Integer estimatedPickupMinutes) {
            this.estimatedPickupMinutes = estimatedPickupMinutes;
            return this;
        }

        public Builder estimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
            this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
            return this;
        }

        public Builder reassignmentTriggered(boolean reassignmentTriggered) {
            this.reassignmentTriggered = reassignmentTriggered;
            return this;
        }

        public Builder newDriverId(String newDriverId) {
            this.newDriverId = newDriverId;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public DriverAcceptanceResponse build() {
            DriverAcceptanceResponse response = new DriverAcceptanceResponse();
            response.trackingId = this.trackingId;
            response.orderId = this.orderId;
            response.status = this.status;
            response.driverId = this.driverId;
            response.driverName = this.driverName;
            response.acceptedAt = this.acceptedAt;
            response.rejectedAt = this.rejectedAt;
            response.rejectionReason = this.rejectionReason;
            response.estimatedPickupMinutes = this.estimatedPickupMinutes;
            response.estimatedDeliveryMinutes = this.estimatedDeliveryMinutes;
            response.reassignmentTriggered = this.reassignmentTriggered;
            response.newDriverId = this.newDriverId;
            response.message = this.message;
            return response;
        }
    }
}
