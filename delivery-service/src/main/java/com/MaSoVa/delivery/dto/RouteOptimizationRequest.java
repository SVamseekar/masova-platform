package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for route optimization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationRequest {

    private AddressDTO origin; // Driver's current location
    private AddressDTO destination; // Customer's delivery address
    private String travelMode; // DRIVING (default), WALKING, BICYCLING
    private Boolean avoidTolls;
    private Boolean avoidHighways;
}
