package com.MaSoVa.logistics.delivery.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for auto-dispatching a driver to an order
 * Supports both frontend format (pickupLocation/deliveryLocation) and backend format (deliveryAddress)
 */
public class AutoDispatchRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    // Backend format
    private AddressDTO deliveryAddress;

    // Frontend format - GeoJSON Point format
    private GeoLocation pickupLocation;
    private GeoLocation deliveryLocation;
    private String priorityLevel; // LOW, MEDIUM, HIGH, URGENT

    // Optional: manually assign to specific driver
    private String preferredDriverId;

    public AutoDispatchRequest() {
    }

    // Nested class for GeoJSON Point format from frontend
    public static class GeoLocation {
        private String type; // "Point"
        private double[] coordinates; // [longitude, latitude]

        public GeoLocation() {
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public double[] getCoordinates() {
            return coordinates;
        }

        public void setCoordinates(double[] coordinates) {
            this.coordinates = coordinates;
        }

        // Helper to get latitude (coordinates[1])
        public Double getLatitude() {
            return coordinates != null && coordinates.length > 1 ? coordinates[1] : null;
        }

        // Helper to get longitude (coordinates[0])
        public Double getLongitude() {
            return coordinates != null && coordinates.length > 0 ? coordinates[0] : null;
        }
    }

    /**
     * Gets the effective delivery address - either from deliveryAddress field
     * or constructed from deliveryLocation (GeoJSON format from frontend)
     */
    public AddressDTO getEffectiveDeliveryAddress() {
        if (deliveryAddress != null) {
            return deliveryAddress;
        }
        if (deliveryLocation != null && deliveryLocation.getCoordinates() != null) {
            return AddressDTO.builder()
                    .latitude(deliveryLocation.getLatitude())
                    .longitude(deliveryLocation.getLongitude())
                    .build();
        }
        return null;
    }

    /**
     * Gets the effective pickup address from pickupLocation (GeoJSON format)
     */
    public AddressDTO getEffectivePickupAddress() {
        if (pickupLocation != null && pickupLocation.getCoordinates() != null) {
            return AddressDTO.builder()
                    .latitude(pickupLocation.getLatitude())
                    .longitude(pickupLocation.getLongitude())
                    .build();
        }
        return null;
    }

    // Getters and Setters

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public AddressDTO getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(AddressDTO deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public GeoLocation getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(GeoLocation pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public GeoLocation getDeliveryLocation() {
        return deliveryLocation;
    }

    public void setDeliveryLocation(GeoLocation deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }

    public String getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public String getPreferredDriverId() {
        return preferredDriverId;
    }

    public void setPreferredDriverId(String preferredDriverId) {
        this.preferredDriverId = preferredDriverId;
    }
}
