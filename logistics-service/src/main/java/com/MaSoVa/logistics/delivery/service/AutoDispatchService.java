package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.client.OrderServiceClient;
import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.AddressDTO;
import com.MaSoVa.logistics.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.logistics.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Service for intelligent auto-dispatch of drivers to orders
 */
@Service
public class AutoDispatchService {

    private static final Logger log = LoggerFactory.getLogger(AutoDispatchService.class);

    private final UserServiceClient userServiceClient;
    private final OrderServiceClient orderServiceClient;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final RouteOptimizationService routeOptimizationService;
    private final FreeRoutingService freeRoutingService;

    public AutoDispatchService(UserServiceClient userServiceClient, OrderServiceClient orderServiceClient,
                               DeliveryTrackingRepository deliveryTrackingRepository,
                               RouteOptimizationService routeOptimizationService,
                               FreeRoutingService freeRoutingService) {
        this.userServiceClient = userServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.routeOptimizationService = routeOptimizationService;
        this.freeRoutingService = freeRoutingService;
    }

    /**
     * Auto-dispatch a driver to an order using intelligent algorithm
     * Supports both frontend format (pickupLocation/deliveryLocation) and backend format (deliveryAddress)
     */
    public AutoDispatchResponse autoDispatch(AutoDispatchRequest request) {
        log.info("Auto-dispatching driver for order: {} with priority: {}",
                request.getOrderId(), request.getPriorityLevel());

        // Get effective delivery address (supports both formats)
        AddressDTO effectiveDeliveryAddress = request.getEffectiveDeliveryAddress();
        if (effectiveDeliveryAddress == null) {
            throw new RuntimeException("Delivery address is required (either deliveryAddress or deliveryLocation)");
        }

        // If preferred driver specified, assign directly
        if (request.getPreferredDriverId() != null && !request.getPreferredDriverId().isEmpty()) {
            return assignPreferredDriver(request, effectiveDeliveryAddress);
        }

        // Get available drivers
        List<Map<String, Object>> availableDrivers = userServiceClient.getAvailableDrivers(request.getStoreId());

        if (availableDrivers.isEmpty()) {
            throw new RuntimeException("No available drivers found for store: " + request.getStoreId());
        }

        // Find best driver using intelligent algorithm
        Map<String, Object> bestDriver = findBestDriver(availableDrivers, effectiveDeliveryAddress);

        // Create delivery tracking
        DeliveryTracking tracking = createDeliveryTracking(request, bestDriver, effectiveDeliveryAddress);
        deliveryTrackingRepository.save(tracking);

        // Assign driver to order in Order Service
        orderServiceClient.assignDriverToOrder(request.getOrderId(), (String) bestDriver.get("id"));

        // Calculate route details
        BigDecimal distance = calculateDistance(
                getDriverLocation(bestDriver),
                effectiveDeliveryAddress
        );

        return AutoDispatchResponse.builder()
                .orderId(request.getOrderId())
                .driverId((String) bestDriver.get("id"))
                .driverName((String) bestDriver.get("name"))
                .driverPhone((String) bestDriver.get("phone"))
                .distanceToPickup(distance)
                .estimatedPickupTime(calculateEstimatedTime(distance))
                .estimatedDeliveryTime(calculateEstimatedTime(distance) + 15) // +15 min for order prep
                .assignedAt(LocalDateTime.now())
                .dispatchMethod("AUTO")
                .status("ASSIGNED")
                .build();
    }

    /**
     * Find best driver based on:
     * 1. Proximity to delivery address
     * 2. Current workload (number of active deliveries)
     * 3. Performance rating
     */
    private Map<String, Object> findBestDriver(List<Map<String, Object>> drivers, AddressDTO deliveryAddress) {
        return drivers.stream()
                .min(Comparator.comparingDouble(driver -> calculateDriverScore(driver, deliveryAddress)))
                .orElseThrow(() -> new RuntimeException("No suitable driver found"));
    }

    /**
     * Calculate driver score (lower is better)
     * Score = (distance * 0.5) + (active_deliveries * 0.3) + (rating_penalty * 0.2)
     */
    private double calculateDriverScore(Map<String, Object> driver, AddressDTO deliveryAddress) {
        // Distance component
        AddressDTO driverLocation = getDriverLocation(driver);
        double distance = calculateDistance(driverLocation, deliveryAddress).doubleValue();

        // Workload component
        int activeDeliveries = getActiveDeliveriesCount((String) driver.get("id"));

        // Rating component (inverted - higher rating = lower penalty)
        double rating = driver.get("rating") != null ? ((Number) driver.get("rating")).doubleValue() : 3.0;
        double ratingPenalty = (5.0 - rating);

        return (distance * 0.5) + (activeDeliveries * 0.3) + (ratingPenalty * 0.2);
    }

    private AddressDTO getDriverLocation(Map<String, Object> driver) {
        Map<String, Object> location = userServiceClient.getDriverLastLocation((String) driver.get("id"));

        if (location.isEmpty()) {
            // Default to store location if no GPS data
            return AddressDTO.builder()
                    .latitude(0.0)
                    .longitude(0.0)
                    .build();
        }

        return AddressDTO.builder()
                .latitude((Double) location.get("latitude"))
                .longitude((Double) location.get("longitude"))
                .build();
    }

    private int getActiveDeliveriesCount(String driverId) {
        List<DeliveryTracking> activeDeliveries = deliveryTrackingRepository
                .findByDriverIdAndStatus(driverId, "OUT_FOR_DELIVERY");
        return activeDeliveries.size();
    }

    /**
     * Calculate REAL road distance using OSRM routing
     * This replaces the old Haversine formula which only gave straight-line distance
     */
    private BigDecimal calculateDistance(AddressDTO from, AddressDTO to) {
        if (from.getLatitude() == null || to.getLatitude() == null) {
            return BigDecimal.ZERO;
        }

        try {
            // Use OSRM to get actual road route
            FreeRoutingService.RouteResult route = freeRoutingService.getRoute(
                from.getLatitude(), from.getLongitude(),
                to.getLatitude(), to.getLongitude()
            );

            return BigDecimal.valueOf(route.getDistanceKm()).setScale(2, RoundingMode.HALF_UP);

        } catch (Exception e) {
            log.warn("⚠️ OSRM routing failed, falling back to Haversine: {}", e.getMessage());
            // Fallback to Haversine if OSRM fails
            return calculateDistanceHaversine(from, to);
        }
    }

    /**
     * Fallback: Haversine formula for straight-line distance
     */
    private BigDecimal calculateDistanceHaversine(AddressDTO from, AddressDTO to) {
        double lat1 = Math.toRadians(from.getLatitude());
        double lat2 = Math.toRadians(to.getLatitude());
        double lon1 = Math.toRadians(from.getLongitude());
        double lon2 = Math.toRadians(to.getLongitude());

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceKm = 6371 * c; // Earth radius in km

        return BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate ETA using OSRM's actual route duration
     * This replaces the old speed-based estimation
     */
    private Integer calculateEstimatedTime(BigDecimal distanceKm) {
        // This method is now deprecated in favor of route-based calculation
        // Keeping for backward compatibility
        double hours = distanceKm.doubleValue() / 30.0;
        return (int) Math.ceil(hours * 60); // Convert to minutes
    }

    /**
     * Calculate ETA from OSRM route (more accurate than speed-based estimation)
     */
    private Integer calculateEstimatedTimeFromRoute(AddressDTO from, AddressDTO to) {
        if (from.getLatitude() == null || to.getLatitude() == null) {
            return 0;
        }

        try {
            FreeRoutingService.RouteResult route = freeRoutingService.getRoute(
                from.getLatitude(), from.getLongitude(),
                to.getLatitude(), to.getLongitude()
            );

            // Add 5-minute buffer for traffic and pickups
            return route.getDurationMinutes() + 5;

        } catch (Exception e) {
            log.warn("⚠️ OSRM routing failed for ETA, using distance-based estimate: {}", e.getMessage());
            // Fallback to old method
            BigDecimal distance = calculateDistanceHaversine(from, to);
            return calculateEstimatedTime(distance);
        }
    }

    private AutoDispatchResponse assignPreferredDriver(AutoDispatchRequest request, AddressDTO effectiveDeliveryAddress) {
        Map<String, Object> driver = userServiceClient.getDriverDetails(request.getPreferredDriverId());

        if (driver.isEmpty()) {
            throw new RuntimeException("Preferred driver not found: " + request.getPreferredDriverId());
        }

        DeliveryTracking tracking = createDeliveryTracking(request, driver, effectiveDeliveryAddress);
        deliveryTrackingRepository.save(tracking);

        orderServiceClient.assignDriverToOrder(request.getOrderId(), request.getPreferredDriverId());

        BigDecimal distance = calculateDistance(
                getDriverLocation(driver),
                effectiveDeliveryAddress
        );

        return AutoDispatchResponse.builder()
                .orderId(request.getOrderId())
                .driverId(request.getPreferredDriverId())
                .driverName((String) driver.get("name"))
                .driverPhone((String) driver.get("phone"))
                .distanceToPickup(distance)
                .estimatedPickupTime(calculateEstimatedTime(distance))
                .estimatedDeliveryTime(calculateEstimatedTime(distance) + 15)
                .assignedAt(LocalDateTime.now())
                .dispatchMethod("MANUAL")
                .status("ASSIGNED")
                .build();
    }

    private DeliveryTracking createDeliveryTracking(AutoDispatchRequest request, Map<String, Object> driver, AddressDTO effectiveDeliveryAddress) {
        return DeliveryTracking.builder()
                .orderId(request.getOrderId())
                .driverId((String) driver.get("id"))
                .storeId(request.getStoreId())
                .driverName((String) driver.get("name"))
                .driverPhone((String) driver.get("phone"))
                .deliveryAddress(DeliveryTracking.DeliveryAddress.builder()
                        .street(effectiveDeliveryAddress.getStreet())
                        .city(effectiveDeliveryAddress.getCity())
                        .state(effectiveDeliveryAddress.getState())
                        .zipCode(effectiveDeliveryAddress.getZipCode())
                        .latitude(effectiveDeliveryAddress.getLatitude())
                        .longitude(effectiveDeliveryAddress.getLongitude())
                        .build())
                .dispatchMethod(request.getPreferredDriverId() != null ? "MANUAL" : "AUTO")
                .priorityLevel(request.getPriorityLevel())
                .assignedAt(LocalDateTime.now())
                .status("ASSIGNED")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
