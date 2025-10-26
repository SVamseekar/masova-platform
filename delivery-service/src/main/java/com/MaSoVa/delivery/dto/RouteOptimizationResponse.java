package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for optimized route
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationResponse {

    private BigDecimal distanceKm;
    private Integer durationMinutes;
    private String polyline; // Encoded polyline for map display
    private List<Step> steps; // Turn-by-turn directions
    private AddressDTO startLocation;
    private AddressDTO endLocation;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step {
        private String instruction; // "Turn left on Main St"
        private BigDecimal distanceMeters;
        private Integer durationSeconds;
        private String maneuver; // "turn-left", "turn-right", etc.
    }
}
