package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for ETA calculation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETAResponse {

    private String orderId;
    private Integer estimatedMinutes;
    private LocalDateTime estimatedArrival;
    private BigDecimal distanceRemainingKm;
    private String status; // ON_TIME, DELAYED, ARRIVED
    private LocalDateTime calculatedAt;

    // Traffic consideration
    private String trafficCondition; // LIGHT, MODERATE, HEAVY
    private Integer trafficDelayMinutes;
}
