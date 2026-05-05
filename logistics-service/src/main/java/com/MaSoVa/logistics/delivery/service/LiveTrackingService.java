package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.dto.LocationUpdateRequest;
import com.MaSoVa.logistics.delivery.dto.TrackingResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.entity.DriverLocation;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.repository.DriverLocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for live tracking of driver locations
 */
@Service
public class LiveTrackingService {

    private static final Logger log = LoggerFactory.getLogger(LiveTrackingService.class);

    private final DriverLocationRepository driverLocationRepository;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    @SuppressWarnings("unused")
    private final ETACalculationService etaCalculationService;
    private final SimpMessagingTemplate messagingTemplate;

    public LiveTrackingService(DriverLocationRepository driverLocationRepository, DeliveryTrackingRepository deliveryTrackingRepository,
                               ETACalculationService etaCalculationService, SimpMessagingTemplate messagingTemplate) {
        this.driverLocationRepository = driverLocationRepository;
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.etaCalculationService = etaCalculationService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Update driver's real-time location
     */
    public void updateDriverLocation(LocationUpdateRequest request) {
        log.info("Updating location for driver: {}", request.getDriverId());

        // Save location to database
        DriverLocation location = DriverLocation.builder()
                .driverId(request.getDriverId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(new double[]{request.getLongitude(), request.getLatitude()}) // MongoDB GeoJSON format
                .accuracy(request.getAccuracy())
                .speed(request.getSpeed())
                .heading(request.getHeading())
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        DriverLocation savedLocation = driverLocationRepository.save(location);

        // Broadcast location update via WebSocket
        broadcastLocationUpdate(request.getDriverId(), savedLocation);

        log.debug("Location updated for driver: {}", request.getDriverId());
    }

    /**
     * Get tracking information for a specific order
     */
    public TrackingResponse getOrderTracking(String orderId) {
        log.info("Getting tracking info for order: {}", orderId);

        Optional<DeliveryTracking> trackingOpt = deliveryTrackingRepository.findByOrderId(orderId);

        if (trackingOpt.isEmpty()) {
            throw new RuntimeException("Tracking not found for order: " + orderId);
        }

        DeliveryTracking tracking = trackingOpt.get();

        // Get driver's current location
        Optional<DriverLocation> locationOpt = driverLocationRepository
                .findTopByDriverIdOrderByTimestampDesc(tracking.getDriverId());

        TrackingResponse.LocationInfo locationInfo = null;
        Integer eta = null;
        BigDecimal distanceRemaining = BigDecimal.ZERO;

        if (locationOpt.isPresent()) {
            DriverLocation location = locationOpt.get();

            locationInfo = TrackingResponse.LocationInfo.builder()
                    .latitude(location.getLatitude())
                    .longitude(location.getLongitude())
                    .speed(location.getSpeed())
                    .heading(location.getHeading())
                    .timestamp(location.getTimestamp())
                    .build();

            // Calculate ETA and distance remaining
            if (tracking.getDeliveryAddress() != null) {
                distanceRemaining = calculateDistance(
                        location.getLatitude(),
                        location.getLongitude(),
                        tracking.getDeliveryAddress().getLatitude(),
                        tracking.getDeliveryAddress().getLongitude()
                );

                eta = calculateETA(distanceRemaining);
            }
        }

        return TrackingResponse.builder()
                .orderId(orderId)
                .orderStatus(tracking.getStatus())
                .driver(TrackingResponse.DriverInfo.builder()
                        .driverId(tracking.getDriverId())
                        .driverName(tracking.getDriverName())
                        .driverPhone(tracking.getDriverPhone())
                        .vehicleInfo("Vehicle info") // TODO: Add vehicle info to tracking
                        .build())
                .currentLocation(locationInfo)
                .estimatedArrivalMinutes(eta)
                .distanceRemainingKm(distanceRemaining)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    /**
     * Broadcast location update to WebSocket subscribers
     */
    private void broadcastLocationUpdate(String driverId, @NonNull DriverLocation location) {
        try {
            messagingTemplate.convertAndSend(
                    "/topic/driver/" + driverId + "/location",
                    location
            );
            log.debug("Broadcasted location update for driver: {}", driverId);
        } catch (Exception e) {
            log.error("Error broadcasting location update: {}", e.getMessage());
        }
    }

    /**
     * Calculate distance using Haversine formula
     */
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

    private Integer calculateETA(BigDecimal distanceKm) {
        // Assume average speed of 30 km/h
        double hours = distanceKm.doubleValue() / 30.0;
        return (int) Math.ceil(hours * 60); // Convert to minutes
    }
}
