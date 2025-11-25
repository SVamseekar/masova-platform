package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for auto-dispatch results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
