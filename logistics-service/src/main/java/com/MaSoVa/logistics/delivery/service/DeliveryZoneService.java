package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.dto.DeliveryFeeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Service for managing delivery zones and calculating delivery fees.
 * DELIV-005: Service Area Definition
 *
 * Features:
 * - Check if delivery address is within service area
 * - Calculate zone-based delivery fees
 * - Validate pincode restrictions
 * - Estimate delivery times based on distance
 */
@Service
public class DeliveryZoneService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryZoneService.class);

    private final RestTemplate restTemplate;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    // Default zone pricing (used if store doesn't have custom zones)
    private static final double ZONE_A_MAX_KM = 3.0;
    private static final double ZONE_B_MAX_KM = 6.0;
    private static final double ZONE_C_MAX_KM = 10.0;

    private static final double ZONE_A_FEE = 30.0;
    private static final double ZONE_B_FEE = 50.0;
    private static final double ZONE_C_FEE = 80.0;

    private static final int ZONE_A_DELIVERY_MINUTES = 15;
    private static final int ZONE_B_DELIVERY_MINUTES = 25;
    private static final int ZONE_C_DELIVERY_MINUTES = 35;

    public DeliveryZoneService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Check if delivery location is within store's service area
     */
    public boolean isWithinDeliveryZone(String storeId, double latitude, double longitude) {
        try {
            Map<String, Object> storeData = getStoreDetails(storeId);

            if (storeData == null) {
                log.warn("Store not found: {}", storeId);
                return false;
            }

            // Get store location
            Object addressObj = storeData.get("address");
            if (!(addressObj instanceof Map)) {
                log.warn("Store address not found or invalid for: {}", storeId);
                return false;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> address = (Map<String, Object>) addressObj;

            Double storeLat = ((Number) address.get("latitude")).doubleValue();
            Double storeLon = ((Number) address.get("longitude")).doubleValue();

            // Calculate distance
            double distance = calculateHaversineDistance(storeLat, storeLon, latitude, longitude);

            // Get max delivery radius
            double maxRadius = getMaxDeliveryRadius(storeData);

            boolean isWithin = distance <= maxRadius;
            log.debug("Delivery zone check for store {}: distance={} km, maxRadius={} km, isWithin={}",
                    storeId, distance, maxRadius, isWithin);

            return isWithin;

        } catch (Exception e) {
            log.error("Error checking delivery zone for store {}: {}", storeId, e.getMessage());
            return false;
        }
    }

    /**
     * Check if pincode is restricted for delivery
     */
    public boolean isPincodeRestricted(String storeId, String pincode) {
        try {
            Map<String, Object> storeData = getStoreDetails(storeId);
            if (storeData == null) return false;

            Object configObj = storeData.get("configuration");
            if (!(configObj instanceof Map)) return false;
            @SuppressWarnings("unchecked")
            Map<String, Object> config = (Map<String, Object>) configObj;

            Object serviceAreaObj = config.get("serviceArea");
            if (!(serviceAreaObj instanceof Map)) return false;
            @SuppressWarnings("unchecked")
            Map<String, Object> serviceArea = (Map<String, Object>) serviceAreaObj;

            Object pincodesObj = serviceArea.get("restrictedPincodes");
            if (!(pincodesObj instanceof List)) return false;
            @SuppressWarnings("unchecked")
            List<String> restrictedPincodes = (List<String>) pincodesObj;

            if (restrictedPincodes.isEmpty()) {
                return false;
            }

            return restrictedPincodes.contains(pincode);

        } catch (Exception e) {
            log.error("Error checking pincode restrictions: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calculate delivery fee based on distance and zone
     */
    public DeliveryFeeResponse calculateDeliveryFee(String storeId, double latitude, double longitude) {
        try {
            Map<String, Object> storeData = getStoreDetails(storeId);

            if (storeData == null) {
                return DeliveryFeeResponse.error("Store not found");
            }

            // Get store location
            Object addressObj = storeData.get("address");
            if (!(addressObj instanceof Map)) {
                return DeliveryFeeResponse.error("Store address not configured");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> address = (Map<String, Object>) addressObj;

            Double storeLat = ((Number) address.get("latitude")).doubleValue();
            Double storeLon = ((Number) address.get("longitude")).doubleValue();

            // Calculate distance
            double distance = calculateHaversineDistance(storeLat, storeLon, latitude, longitude);

            // Get max delivery radius
            double maxRadius = getMaxDeliveryRadius(storeData);

            if (distance > maxRadius) {
                return DeliveryFeeResponse.builder()
                        .success(false)
                        .error("Address is outside delivery area. Maximum delivery distance is " + maxRadius + " km.")
                        .distanceKm(distance)
                        .build();
            }

            // Determine zone and calculate fee
            String zoneName;
            double deliveryFee;
            int estimatedMinutes;

            if (distance <= ZONE_A_MAX_KM) {
                zoneName = "A";
                deliveryFee = ZONE_A_FEE;
                estimatedMinutes = ZONE_A_DELIVERY_MINUTES;
            } else if (distance <= ZONE_B_MAX_KM) {
                zoneName = "B";
                deliveryFee = ZONE_B_FEE;
                estimatedMinutes = ZONE_B_DELIVERY_MINUTES;
            } else {
                zoneName = "C";
                deliveryFee = ZONE_C_FEE;
                estimatedMinutes = ZONE_C_DELIVERY_MINUTES;
            }

            // Check for custom zone pricing in store config
            DeliveryFeeResponse customFee = getCustomZoneFee(storeData, distance);
            if (customFee != null && customFee.isSuccess()) {
                return customFee;
            }

            return DeliveryFeeResponse.builder()
                    .success(true)
                    .zoneName(zoneName)
                    .deliveryFeeINR(deliveryFee)
                    .distanceKm(Math.round(distance * 100.0) / 100.0)
                    .estimatedDeliveryMinutes(estimatedMinutes)
                    .build();

        } catch (Exception e) {
            log.error("Error calculating delivery fee for store {}: {}", storeId, e.getMessage());
            return DeliveryFeeResponse.error("Failed to calculate delivery fee: " + e.getMessage());
        }
    }

    /**
     * Get all delivery zones for a store
     */
    public List<Map<String, Object>> getDeliveryZones(String storeId) {
        try {
            Map<String, Object> storeData = getStoreDetails(storeId);
            if (storeData == null) return null;

            Object configObj = storeData.get("configuration");
            if (!(configObj instanceof Map)) return getDefaultZones();
            @SuppressWarnings("unchecked")
            Map<String, Object> config = (Map<String, Object>) configObj;

            Object serviceAreaObj = config.get("serviceArea");
            if (!(serviceAreaObj instanceof Map)) return getDefaultZones();
            @SuppressWarnings("unchecked")
            Map<String, Object> serviceArea = (Map<String, Object>) serviceAreaObj;

            Object zonesObj = serviceArea.get("zones");
            if (!(zonesObj instanceof List)) return getDefaultZones();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> zones = (List<Map<String, Object>>) zonesObj;
            return zones;

        } catch (Exception e) {
            log.error("Error getting delivery zones for store {}: {}", storeId, e.getMessage());
            return getDefaultZones();
        }
    }

    /**
     * Validate delivery address
     */
    public ValidationResult validateDeliveryAddress(String storeId, double latitude, double longitude, String pincode) {
        ValidationResult result = new ValidationResult();

        // Check if within delivery zone
        if (!isWithinDeliveryZone(storeId, latitude, longitude)) {
            result.setValid(false);
            result.setError("Address is outside our delivery area");
            return result;
        }

        // Check pincode restrictions
        if (pincode != null && isPincodeRestricted(storeId, pincode)) {
            result.setValid(false);
            result.setError("Delivery is not available to this pincode");
            return result;
        }

        // Calculate delivery fee
        DeliveryFeeResponse feeResponse = calculateDeliveryFee(storeId, latitude, longitude);
        if (!feeResponse.isSuccess()) {
            result.setValid(false);
            result.setError(feeResponse.getError());
            return result;
        }

        result.setValid(true);
        result.setDeliveryFee(feeResponse.getDeliveryFeeINR());
        result.setZoneName(feeResponse.getZoneName());
        result.setEstimatedMinutes(feeResponse.getEstimatedDeliveryMinutes());
        result.setDistanceKm(feeResponse.getDistanceKm());

        return result;
    }

    // ===========================================
    // Private helper methods
    // ===========================================

    @SuppressWarnings("unchecked")
    private Map<String, Object> getStoreDetails(String storeId) {
        try {
            String url = userServiceUrl + "/api/stores/" + storeId;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Failed to fetch store details: {}", e.getMessage());
            return null;
        }
    }

    private double getMaxDeliveryRadius(Map<String, Object> storeData) {
        try {
            Object configObj = storeData.get("configuration");
            if (configObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> config = (Map<String, Object>) configObj;
                if (config.get("deliveryRadiusKm") != null) {
                    return ((Number) config.get("deliveryRadiusKm")).doubleValue();
                }
            }
        } catch (Exception e) {
            log.debug("Using default delivery radius");
        }
        return ZONE_C_MAX_KM;  // Default 10km
    }

    private DeliveryFeeResponse getCustomZoneFee(Map<String, Object> storeData, double distance) {
        try {
            Object configObj = storeData.get("configuration");
            if (!(configObj instanceof Map)) return null;
            @SuppressWarnings("unchecked")
            Map<String, Object> config = (Map<String, Object>) configObj;

            Object serviceAreaObj = config.get("serviceArea");
            if (!(serviceAreaObj instanceof Map)) return null;
            @SuppressWarnings("unchecked")
            Map<String, Object> serviceArea = (Map<String, Object>) serviceAreaObj;

            Object zonesObj = serviceArea.get("zones");
            if (!(zonesObj instanceof List)) return null;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> zones = (List<Map<String, Object>>) zonesObj;
            if (zones.isEmpty()) return null;

            for (Map<String, Object> zone : zones) {
                double minDist = ((Number) zone.get("minDistanceKm")).doubleValue();
                double maxDist = ((Number) zone.get("maxDistanceKm")).doubleValue();

                if (distance >= minDist && distance < maxDist) {
                    Boolean active = (Boolean) zone.get("active");
                    if (active != null && !active) continue;

                    return DeliveryFeeResponse.builder()
                            .success(true)
                            .zoneName((String) zone.get("zoneName"))
                            .deliveryFeeINR(((Number) zone.get("deliveryFeeINR")).doubleValue())
                            .distanceKm(Math.round(distance * 100.0) / 100.0)
                            .estimatedDeliveryMinutes(((Number) zone.get("estimatedDeliveryMinutes")).intValue())
                            .build();
                }
            }
        } catch (Exception e) {
            log.debug("Error parsing custom zones: {}", e.getMessage());
        }
        return null;
    }

    private List<Map<String, Object>> getDefaultZones() {
        return List.of(
                Map.of("zoneName", "A", "minDistanceKm", 0.0, "maxDistanceKm", ZONE_A_MAX_KM,
                        "deliveryFeeINR", ZONE_A_FEE, "estimatedDeliveryMinutes", ZONE_A_DELIVERY_MINUTES),
                Map.of("zoneName", "B", "minDistanceKm", ZONE_A_MAX_KM, "maxDistanceKm", ZONE_B_MAX_KM,
                        "deliveryFeeINR", ZONE_B_FEE, "estimatedDeliveryMinutes", ZONE_B_DELIVERY_MINUTES),
                Map.of("zoneName", "C", "minDistanceKm", ZONE_B_MAX_KM, "maxDistanceKm", ZONE_C_MAX_KM,
                        "deliveryFeeINR", ZONE_C_FEE, "estimatedDeliveryMinutes", ZONE_C_DELIVERY_MINUTES)
        );
    }

    /**
     * Calculate distance using Haversine formula
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;  // Earth's radius in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Validation result DTO
     */
    public static class ValidationResult {
        private boolean valid;
        private String error;
        private double deliveryFee;
        private String zoneName;
        private int estimatedMinutes;
        private double distanceKm;

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }

        public double getDeliveryFee() { return deliveryFee; }
        public void setDeliveryFee(double deliveryFee) { this.deliveryFee = deliveryFee; }

        public String getZoneName() { return zoneName; }
        public void setZoneName(String zoneName) { this.zoneName = zoneName; }

        public int getEstimatedMinutes() { return estimatedMinutes; }
        public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

        public double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    }
}
