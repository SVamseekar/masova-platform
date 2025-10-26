package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for customer order tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingResponse {

    private String orderId;
    private String orderStatus; // PREPARING, OUT_FOR_DELIVERY, DELIVERED
    private DriverInfo driver;
    private LocationInfo currentLocation;
    private Integer estimatedArrivalMinutes;
    private BigDecimal distanceRemainingKm;
    private LocalDateTime lastUpdated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverInfo {
        private String driverId;
        private String driverName;
        private String driverPhone;
        private String vehicleInfo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private Double latitude;
        private Double longitude;
        private Double speed;
        private Double heading;
        private LocalDateTime timestamp;
    }
}
