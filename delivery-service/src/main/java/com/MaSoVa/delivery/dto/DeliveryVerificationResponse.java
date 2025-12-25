package com.MaSoVa.delivery.dto;

import java.time.LocalDateTime;

/**
 * DTO for delivery verification response
 * Implements DELIV-002: Proof of Delivery
 */
public class DeliveryVerificationResponse {

    private String orderId;
    private String orderNumber;
    private boolean verified;
    private String message;
    private String proofType;
    private String deliveryPhotoUrl;
    private String signatureUrl;
    private LocalDateTime deliveredAt;
    private String deliveredBy; // Driver name
    private String driverId;

    public DeliveryVerificationResponse() {
    }

    // Getters and Setters
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getProofType() {
        return proofType;
    }

    public void setProofType(String proofType) {
        this.proofType = proofType;
    }

    public String getDeliveryPhotoUrl() {
        return deliveryPhotoUrl;
    }

    public void setDeliveryPhotoUrl(String deliveryPhotoUrl) {
        this.deliveryPhotoUrl = deliveryPhotoUrl;
    }

    public String getSignatureUrl() {
        return signatureUrl;
    }

    public void setSignatureUrl(String signatureUrl) {
        this.signatureUrl = signatureUrl;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public String getDeliveredBy() {
        return deliveredBy;
    }

    public void setDeliveredBy(String deliveredBy) {
        this.deliveredBy = deliveredBy;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DeliveryVerificationResponse response = new DeliveryVerificationResponse();

        public Builder orderId(String orderId) {
            response.orderId = orderId;
            return this;
        }

        public Builder orderNumber(String orderNumber) {
            response.orderNumber = orderNumber;
            return this;
        }

        public Builder verified(boolean verified) {
            response.verified = verified;
            return this;
        }

        public Builder message(String message) {
            response.message = message;
            return this;
        }

        public Builder proofType(String proofType) {
            response.proofType = proofType;
            return this;
        }

        public Builder deliveryPhotoUrl(String deliveryPhotoUrl) {
            response.deliveryPhotoUrl = deliveryPhotoUrl;
            return this;
        }

        public Builder signatureUrl(String signatureUrl) {
            response.signatureUrl = signatureUrl;
            return this;
        }

        public Builder deliveredAt(LocalDateTime deliveredAt) {
            response.deliveredAt = deliveredAt;
            return this;
        }

        public Builder deliveredBy(String deliveredBy) {
            response.deliveredBy = deliveredBy;
            return this;
        }

        public Builder driverId(String driverId) {
            response.driverId = driverId;
            return this;
        }

        public DeliveryVerificationResponse build() {
            return response;
        }
    }
}
