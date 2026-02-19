package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.dto.RouteOptimizationRequest;
import com.MaSoVa.logistics.delivery.dto.RouteOptimizationResponse;
import com.google.maps.DirectionsApi;
import com.google.maps.DirectionsApiRequest;
import com.google.maps.GeoApiContext;
import com.google.maps.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for route optimization using Google Maps API
 */
@Service
public class RouteOptimizationService {

    private static final Logger log = LoggerFactory.getLogger(RouteOptimizationService.class);

    @Autowired(required = false)
    private GeoApiContext geoApiContext;

    /**
     * Get optimized route from origin to destination
     */
    @Cacheable(value = "routes", key = "#request.origin.latitude + '-' + #request.destination.latitude")
    public RouteOptimizationResponse getOptimizedRoute(RouteOptimizationRequest request) {
        log.info("Calculating optimized route");

        // If Google Maps API is not configured, return fallback response
        if (geoApiContext == null) {
            return getFallbackRoute(request);
        }

        try {
            // Build directions request
            DirectionsApiRequest directionsRequest = DirectionsApi.newRequest(geoApiContext)
                    .origin(new LatLng(request.getOrigin().getLatitude(), request.getOrigin().getLongitude()))
                    .destination(new LatLng(request.getDestination().getLatitude(), request.getDestination().getLongitude()))
                    .mode(TravelMode.DRIVING);

            // Apply route preferences
            if (Boolean.TRUE.equals(request.getAvoidTolls())) {
                directionsRequest.avoid(DirectionsApi.RouteRestriction.TOLLS);
            }
            if (Boolean.TRUE.equals(request.getAvoidHighways())) {
                directionsRequest.avoid(DirectionsApi.RouteRestriction.HIGHWAYS);
            }

            // Execute request
            DirectionsResult result = directionsRequest.await();

            if (result.routes == null || result.routes.length == 0) {
                log.warn("No routes found, returning fallback");
                return getFallbackRoute(request);
            }

            // Parse first route
            DirectionsRoute route = result.routes[0];
            DirectionsLeg leg = route.legs[0];

            // Build response
            return RouteOptimizationResponse.builder()
                    .distanceKm(BigDecimal.valueOf(leg.distance.inMeters / 1000.0).setScale(2, RoundingMode.HALF_UP))
                    .durationMinutes((int) Math.ceil(leg.duration.inSeconds / 60.0))
                    .polyline(route.overviewPolyline.getEncodedPath())
                    .steps(parseSteps(leg.steps))
                    .startLocation(request.getOrigin())
                    .endLocation(request.getDestination())
                    .build();

        } catch (Exception e) {
            log.error("Error calculating route: {}", e.getMessage());
            return getFallbackRoute(request);
        }
    }

    /**
     * Parse Google Maps steps into our format
     */
    @SuppressWarnings("deprecation")
    private List<RouteOptimizationResponse.Step> parseSteps(DirectionsStep[] steps) {
        List<RouteOptimizationResponse.Step> parsedSteps = new ArrayList<>();

        for (DirectionsStep step : steps) {
            parsedSteps.add(RouteOptimizationResponse.Step.builder()
                    .instruction(step.htmlInstructions.replaceAll("<[^>]*>", "")) // Strip HTML tags
                    .distanceMeters(BigDecimal.valueOf(step.distance.inMeters))
                    .durationSeconds((int) step.duration.inSeconds)
                    .maneuver(step.maneuver != null ? step.maneuver : "")
                    .build());
        }

        return parsedSteps;
    }

    /**
     * Fallback route calculation using straight-line distance (when Google Maps API not available)
     */
    private RouteOptimizationResponse getFallbackRoute(RouteOptimizationRequest request) {
        log.info("Using fallback route calculation");

        double distance = calculateStraightLineDistance(
                request.getOrigin().getLatitude(),
                request.getOrigin().getLongitude(),
                request.getDestination().getLatitude(),
                request.getDestination().getLongitude()
        );

        // Adjust for road distance (typically 1.3x straight-line)
        double roadDistance = distance * 1.3;

        // Assume 30 km/h average speed
        int durationMinutes = (int) Math.ceil((roadDistance / 30.0) * 60);

        return RouteOptimizationResponse.builder()
                .distanceKm(BigDecimal.valueOf(roadDistance).setScale(2, RoundingMode.HALF_UP))
                .durationMinutes(durationMinutes)
                .polyline("") // No polyline in fallback
                .steps(List.of(
                        RouteOptimizationResponse.Step.builder()
                                .instruction("Head to destination")
                                .distanceMeters(BigDecimal.valueOf(roadDistance * 1000))
                                .durationSeconds(durationMinutes * 60)
                                .maneuver("straight")
                                .build()
                ))
                .startLocation(request.getOrigin())
                .endLocation(request.getDestination())
                .build();
    }

    /**
     * Calculate straight-line distance using Haversine formula
     */
    private double calculateStraightLineDistance(double lat1, double lon1, double lat2, double lon2) {
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
        return 6371 * c; // Earth radius in km
    }
}
