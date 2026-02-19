package com.MaSoVa.logistics.delivery.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for driver acceptance of delivery assignment
 * DELIV-003: Driver Acceptance Flow
 */
public class DriverAcceptanceRequest {

    @NotBlank(message = "Tracking ID is required")
    private String trackingId;

    @NotBlank(message = "Driver ID is required")
    private String driverId;

    // Optional: estimated pickup time in minutes
    private Integer estimatedPickupMinutes;

    public DriverAcceptanceRequest() {
    }

    public DriverAcceptanceRequest(String trackingId, String driverId) {
        this.trackingId = trackingId;
        this.driverId = driverId;
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public Integer getEstimatedPickupMinutes() {
        return estimatedPickupMinutes;
    }

    public void setEstimatedPickupMinutes(Integer estimatedPickupMinutes) {
        this.estimatedPickupMinutes = estimatedPickupMinutes;
    }
}
