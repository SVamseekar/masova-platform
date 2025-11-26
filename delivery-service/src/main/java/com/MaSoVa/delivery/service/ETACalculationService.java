package com.MaSoVa.delivery.service;

import com.MaSoVa.delivery.dto.ETAResponse;
import com.MaSoVa.delivery.entity.DeliveryTracking;
import com.MaSoVa.delivery.entity.DriverLocation;
import com.MaSoVa.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.delivery.repository.DriverLocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for calculating estimated time of arrival
 */
@Service
public class ETACalculationService {

    private static final Logger log = LoggerFactory.getLogger(ETACalculationService.class);

    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final DriverLocationRepository driverLocationRepository;

    public ETACalculationService(DeliveryTrackingRepository deliveryTrackingRepository, DriverLocationRepository driverLocationRepository) {
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.driverLocationRepository = driverLocationRepository;
    }

    /**
     * Calculate ETA for an order
     */
    @Cacheable(value = "eta", key = "#orderId")
    public ETAResponse calculateETA(String orderId) {
        log.info("Calculating ETA for order: {}", orderId);

        Optional<DeliveryTracking> trackingOpt = deliveryTrackingRepository.findByOrderId(orderId);

        if (trackingOpt.isEmpty()) {
            throw new RuntimeException("Delivery tracking not found for order: " + orderId);
        }

        DeliveryTracking tracking = trackingOpt.get();

        // Get driver's current location
        Optional<DriverLocation> locationOpt = driverLocationRepository
                .findTopByDriverIdOrderByTimestampDesc(tracking.getDriverId());

        if (locationOpt.isEmpty()) {
            // No location data, use estimated time
            return ETAResponse.builder()
                    .orderId(orderId)
                    .estimatedMinutes(tracking.getEstimatedDeliveryMinutes() != null ? tracking.getEstimatedDeliveryMinutes() : 30)
                    .estimatedArrival(LocalDateTime.now().plusMinutes(tracking.getEstimatedDeliveryMinutes() != null ? tracking.getEstimatedDeliveryMinutes() : 30))
                    .distanceRemainingKm(BigDecimal.ZERO)
                    .status("ON_TIME")
                    .calculatedAt(LocalDateTime.now())
                    .trafficCondition("UNKNOWN")
                    .trafficDelayMinutes(0)
                    .build();
        }

        DriverLocation location = locationOpt.get();

        // Calculate distance remaining
        BigDecimal distanceRemaining = calculateDistance(
                location.getLatitude(),
                location.getLongitude(),
                tracking.getDeliveryAddress().getLatitude(),
                tracking.getDeliveryAddress().getLongitude()
        );

        // Calculate ETA based on distance and current speed
        int estimatedMinutes = calculateEstimatedTime(distanceRemaining, location.getSpeed());

        // Determine if on time
        LocalDateTime estimatedArrival = LocalDateTime.now().plusMinutes(estimatedMinutes);
        String status = determineStatus(tracking, estimatedArrival);

        // Traffic simulation (in real app, use Google Maps Traffic API)
        String trafficCondition = simulateTrafficCondition();
        int trafficDelay = calculateTrafficDelay(trafficCondition);

        return ETAResponse.builder()
                .orderId(orderId)
                .estimatedMinutes(estimatedMinutes + trafficDelay)
                .estimatedArrival(estimatedArrival.plusMinutes(trafficDelay))
                .distanceRemainingKm(distanceRemaining)
                .status(status)
                .calculatedAt(LocalDateTime.now())
                .trafficCondition(trafficCondition)
                .trafficDelayMinutes(trafficDelay)
                .build();
    }

    private BigDecimal calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);
        lon1 = Math.toRadians(lon1);
        lon2 = Math.toRadians(lon2);

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceKm = 6371 * c; // Earth radius in km

        return BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateEstimatedTime(BigDecimal distanceKm, Double currentSpeed) {
        if (currentSpeed == null || currentSpeed <= 0) {
            // Use default speed if no data
            double hours = distanceKm.doubleValue() / 30.0; // 30 km/h default
            return (int) Math.ceil(hours * 60);
        }

        double hours = distanceKm.doubleValue() / currentSpeed;
        return (int) Math.ceil(hours * 60);
    }

    private String determineStatus(DeliveryTracking tracking, LocalDateTime estimatedArrival) {
        if (tracking.getEstimatedDeliveryMinutes() == null) {
            return "ON_TIME";
        }

        LocalDateTime expectedArrival = tracking.getAssignedAt()
                .plusMinutes(tracking.getEstimatedDeliveryMinutes());

        if (estimatedArrival.isBefore(expectedArrival)) {
            return "ON_TIME";
        } else if (estimatedArrival.isBefore(expectedArrival.plusMinutes(10))) {
            return "ON_TIME";
        } else {
            return "DELAYED";
        }
    }

    private String simulateTrafficCondition() {
        // In production, use Google Maps Traffic API
        int hour = LocalDateTime.now().getHour();

        if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) {
            return "HEAVY"; // Rush hour
        } else if (hour >= 12 && hour <= 14) {
            return "MODERATE"; // Lunch time
        } else {
            return "LIGHT";
        }
    }

    private int calculateTrafficDelay(String trafficCondition) {
        return switch (trafficCondition) {
            case "HEAVY" -> 10;
            case "MODERATE" -> 5;
            default -> 0;
        };
    }
}
