package com.MaSoVa.commerce.order.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Objects;

/**
 * Client for communicating with Delivery Service.
 * Used for dynamic delivery fee calculation based on zones (HARD-001).
 * PROD-001: Circuit breaker protection added for resilience
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Service
public class DeliveryServiceClient {

    private static final Logger log = LoggerFactory.getLogger(DeliveryServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.delivery.url:http://localhost:8086}")
    private String deliveryServiceUrl;

    // Default delivery fee if service call fails
    private static final double DEFAULT_DELIVERY_FEE = 50.0;

    public DeliveryServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Calculate delivery fee based on store and delivery location.
     * Uses zone-based pricing from DeliveryZoneService.
     * PROD-001: Circuit breaker protects against delivery service failures
     *
     * @param storeId Store ID
     * @param latitude Delivery address latitude
     * @param longitude Delivery address longitude
     * @return DeliveryFeeResult with fee and zone information
     */
    @Retry(name = "deliveryService")
    @CircuitBreaker(name = "deliveryService", fallbackMethod = "calculateDeliveryFeeFallback")
    public DeliveryFeeResult calculateDeliveryFee(String storeId, Double latitude, Double longitude) {
        if (storeId == null || latitude == null || longitude == null) {
            log.warn("Missing parameters for delivery fee calculation. StoreId: {}, Lat: {}, Lon: {}",
                    storeId, latitude, longitude);
            return DeliveryFeeResult.defaultFee("Missing required parameters");
        }

        try {
            // Phase 1: /api/delivery/zone/fee → /api/delivery/zones?fee=true&storeId=&lat=&lng=
            String url = UriComponentsBuilder.fromHttpUrl(deliveryServiceUrl)
                    .path("/api/delivery/zones")
                    .queryParam("fee", true)
                    .queryParam("storeId", storeId)
                    .queryParam("lat", latitude)
                    .queryParam("lng", longitude)
                    .toUriString();

            log.debug("Calculating delivery fee from URL: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null) {
                log.warn("Null response from delivery service for store: {}", storeId);
                return DeliveryFeeResult.defaultFee("No response from delivery service");
            }

            Boolean success = (Boolean) response.get("success");
            if (success != null && !success) {
                String error = (String) response.get("error");
                log.warn("Delivery fee calculation failed: {}", error);
                return DeliveryFeeResult.error(error);
            }

            double deliveryFee = ((Number) response.get("deliveryFeeINR")).doubleValue();
            String zoneName = (String) response.get("zoneName");
            Double distanceKm = response.get("distanceKm") != null ?
                    ((Number) response.get("distanceKm")).doubleValue() : null;
            Integer estimatedMinutes = response.get("estimatedDeliveryMinutes") != null ?
                    ((Number) response.get("estimatedDeliveryMinutes")).intValue() : null;

            log.info("Calculated delivery fee for store {}: ₹{} (Zone {}, {} km)",
                    storeId, deliveryFee, zoneName, distanceKm);

            return DeliveryFeeResult.success(deliveryFee, zoneName, distanceKm, estimatedMinutes);

        } catch (Exception e) {
            log.error("Error calculating delivery fee for store {}: {}", storeId, e.getMessage());
            return DeliveryFeeResult.defaultFee("Service unavailable: " + e.getMessage());
        }
    }

    /**
     * Validate if delivery address is within service area.
     *
     * @param storeId Store ID
     * @param latitude Delivery address latitude
     * @param longitude Delivery address longitude
     * @param pincode Delivery address pincode (optional)
     * @return true if address is deliverable
     */
    public boolean isWithinDeliveryZone(String storeId, Double latitude, Double longitude, String pincode) {
        if (storeId == null || latitude == null || longitude == null) {
            return false;
        }

        try {
            // Phase 1: /api/delivery/zone/validate → /api/delivery/zones?check=true&storeId=&lat=&lng=
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(deliveryServiceUrl)
                    .path("/api/delivery/zones")
                    .queryParam("check", true)
                    .queryParam("storeId", Objects.requireNonNull(storeId))
                    .queryParam("lat", latitude)
                    .queryParam("lng", longitude);

            if (pincode != null && !pincode.isEmpty()) {
                builder.queryParam("pincode", pincode);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(builder.toUriString(), Map.class);

            if (response == null) {
                return true; // Default to allowing delivery if service is unavailable
            }

            Boolean valid = (Boolean) response.get("valid");
            return valid != null && valid;

        } catch (Exception e) {
            log.error("Error validating delivery zone for store {}: {}", storeId, e.getMessage());
            return true; // Default to allowing delivery if service is unavailable
        }
    }

    /**
     * Result class for delivery fee calculation
     */
    public static class DeliveryFeeResult {
        private final boolean success;
        private final double deliveryFee;
        private final String zoneName;
        private final Double distanceKm;
        private final Integer estimatedMinutes;
        private final String error;
        private final boolean usedDefault;

        private DeliveryFeeResult(boolean success, double deliveryFee, String zoneName,
                                  Double distanceKm, Integer estimatedMinutes, String error, boolean usedDefault) {
            this.success = success;
            this.deliveryFee = deliveryFee;
            this.zoneName = zoneName;
            this.distanceKm = distanceKm;
            this.estimatedMinutes = estimatedMinutes;
            this.error = error;
            this.usedDefault = usedDefault;
        }

        public static DeliveryFeeResult success(double fee, String zone, Double distance, Integer minutes) {
            return new DeliveryFeeResult(true, fee, zone, distance, minutes, null, false);
        }

        public static DeliveryFeeResult defaultFee(String reason) {
            return new DeliveryFeeResult(true, DEFAULT_DELIVERY_FEE, "DEFAULT", null, 30, reason, true);
        }

        public static DeliveryFeeResult error(String error) {
            return new DeliveryFeeResult(false, 0, null, null, null, error, false);
        }

        public boolean isSuccess() { return success; }
        public double getDeliveryFee() { return deliveryFee; }
        public String getZoneName() { return zoneName; }
        public Double getDistanceKm() { return distanceKm; }
        public Integer getEstimatedMinutes() { return estimatedMinutes; }
        public String getError() { return error; }
        public boolean isUsedDefault() { return usedDefault; }
    }

    /**
     * Fallback method for calculateDeliveryFee when circuit breaker is open.
     * PROD-001: Graceful degradation when delivery service is unavailable
     *
     * @param storeId Store ID
     * @param latitude Delivery address latitude
     * @param longitude Delivery address longitude
     * @param ex Exception that triggered the fallback
     * @return Default delivery fee result
     */
    private DeliveryFeeResult calculateDeliveryFeeFallback(String storeId, Double latitude, Double longitude, Exception ex) {
        log.warn("Circuit breaker fallback activated for delivery fee calculation. Store: {}, Error: {}",
                storeId, ex.getMessage());
        return DeliveryFeeResult.defaultFee("Delivery service temporarily unavailable - using default fee");
    }
}
