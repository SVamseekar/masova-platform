package com.MaSoVa.logistics.delivery.dto;

/**
 * Response DTO for delivery fee calculations
 * DELIV-005: Service Area Definition
 */
public class DeliveryFeeResponse {

    private boolean success;
    private String error;
    private String zoneName;
    private double deliveryFeeINR;
    private double distanceKm;
    private int estimatedDeliveryMinutes;
    private double minimumOrderValueINR;

    public DeliveryFeeResponse() {}

    public static DeliveryFeeResponse error(String errorMessage) {
        DeliveryFeeResponse response = new DeliveryFeeResponse();
        response.success = false;
        response.error = errorMessage;
        return response;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public double getDeliveryFeeINR() { return deliveryFeeINR; }
    public void setDeliveryFeeINR(double deliveryFeeINR) { this.deliveryFeeINR = deliveryFeeINR; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public int getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
    public void setEstimatedDeliveryMinutes(int estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }

    public double getMinimumOrderValueINR() { return minimumOrderValueINR; }
    public void setMinimumOrderValueINR(double minimumOrderValueINR) { this.minimumOrderValueINR = minimumOrderValueINR; }

    public static class Builder {
        private boolean success;
        private String error;
        private String zoneName;
        private double deliveryFeeINR;
        private double distanceKm;
        private int estimatedDeliveryMinutes;
        private double minimumOrderValueINR;

        public Builder success(boolean success) {
            this.success = success;
            return this;
        }

        public Builder error(String error) {
            this.error = error;
            return this;
        }

        public Builder zoneName(String zoneName) {
            this.zoneName = zoneName;
            return this;
        }

        public Builder deliveryFeeINR(double deliveryFeeINR) {
            this.deliveryFeeINR = deliveryFeeINR;
            return this;
        }

        public Builder distanceKm(double distanceKm) {
            this.distanceKm = distanceKm;
            return this;
        }

        public Builder estimatedDeliveryMinutes(int estimatedDeliveryMinutes) {
            this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
            return this;
        }

        public Builder minimumOrderValueINR(double minimumOrderValueINR) {
            this.minimumOrderValueINR = minimumOrderValueINR;
            return this;
        }

        public DeliveryFeeResponse build() {
            DeliveryFeeResponse response = new DeliveryFeeResponse();
            response.success = this.success;
            response.error = this.error;
            response.zoneName = this.zoneName;
            response.deliveryFeeINR = this.deliveryFeeINR;
            response.distanceKm = this.distanceKm;
            response.estimatedDeliveryMinutes = this.estimatedDeliveryMinutes;
            response.minimumOrderValueINR = this.minimumOrderValueINR;
            return response;
        }
    }
}
