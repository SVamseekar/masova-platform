package com.MaSoVa.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for delivery verification request (OTP, photo, signature)
 * Implements DELIV-002: Proof of Delivery
 */
public class DeliveryVerificationRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @Pattern(regexp = "^\\d{4}$", message = "OTP must be 4 digits")
    private String otp;

    private String proofType; // OTP, SIGNATURE, PHOTO, CONTACTLESS

    private String deliveryPhotoBase64; // Base64 encoded delivery photo

    private String signatureBase64; // Base64 encoded signature image

    private String deliveryNotes; // Driver notes at delivery

    private Double deliveryLatitude; // GPS coordinates at delivery

    private Double deliveryLongitude;

    public DeliveryVerificationRequest() {
    }

    // Getters and Setters
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getProofType() {
        return proofType;
    }

    public void setProofType(String proofType) {
        this.proofType = proofType;
    }

    public String getDeliveryPhotoBase64() {
        return deliveryPhotoBase64;
    }

    public void setDeliveryPhotoBase64(String deliveryPhotoBase64) {
        this.deliveryPhotoBase64 = deliveryPhotoBase64;
    }

    public String getSignatureBase64() {
        return signatureBase64;
    }

    public void setSignatureBase64(String signatureBase64) {
        this.signatureBase64 = signatureBase64;
    }

    public String getDeliveryNotes() {
        return deliveryNotes;
    }

    public void setDeliveryNotes(String deliveryNotes) {
        this.deliveryNotes = deliveryNotes;
    }

    public Double getDeliveryLatitude() {
        return deliveryLatitude;
    }

    public void setDeliveryLatitude(Double deliveryLatitude) {
        this.deliveryLatitude = deliveryLatitude;
    }

    public Double getDeliveryLongitude() {
        return deliveryLongitude;
    }

    public void setDeliveryLongitude(Double deliveryLongitude) {
        this.deliveryLongitude = deliveryLongitude;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DeliveryVerificationRequest request = new DeliveryVerificationRequest();

        public Builder orderId(String orderId) {
            request.orderId = orderId;
            return this;
        }

        public Builder otp(String otp) {
            request.otp = otp;
            return this;
        }

        public Builder proofType(String proofType) {
            request.proofType = proofType;
            return this;
        }

        public Builder deliveryPhotoBase64(String deliveryPhotoBase64) {
            request.deliveryPhotoBase64 = deliveryPhotoBase64;
            return this;
        }

        public Builder signatureBase64(String signatureBase64) {
            request.signatureBase64 = signatureBase64;
            return this;
        }

        public Builder deliveryNotes(String deliveryNotes) {
            request.deliveryNotes = deliveryNotes;
            return this;
        }

        public Builder deliveryLatitude(Double deliveryLatitude) {
            request.deliveryLatitude = deliveryLatitude;
            return this;
        }

        public Builder deliveryLongitude(Double deliveryLongitude) {
            request.deliveryLongitude = deliveryLongitude;
            return this;
        }

        public DeliveryVerificationRequest build() {
            return request;
        }
    }
}
