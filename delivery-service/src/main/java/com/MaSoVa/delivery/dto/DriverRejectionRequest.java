package com.MaSoVa.delivery.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for driver rejection of delivery assignment
 * DELIV-003: Driver Acceptance Flow
 */
public class DriverRejectionRequest {

    @NotBlank(message = "Tracking ID is required")
    private String trackingId;

    @NotBlank(message = "Driver ID is required")
    private String driverId;

    @NotBlank(message = "Rejection reason is required")
    private String reason;

    // Optional: additional notes for rejection
    private String additionalNotes;

    public DriverRejectionRequest() {
    }

    public DriverRejectionRequest(String trackingId, String driverId, String reason) {
        this.trackingId = trackingId;
        this.driverId = driverId;
        this.reason = reason;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    /**
     * Common rejection reasons
     */
    public enum RejectionReason {
        TOO_FAR("Location too far from current position"),
        VEHICLE_ISSUE("Vehicle breakdown or maintenance"),
        PERSONAL_EMERGENCY("Personal emergency"),
        END_OF_SHIFT("End of shift approaching"),
        ALREADY_BUSY("Already handling another delivery"),
        UNSAFE_LOCATION("Safety concerns with location"),
        OTHER("Other reason");

        private final String description;

        RejectionReason(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
