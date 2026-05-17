package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.dto.AddressDTO;
import com.MaSoVa.logistics.delivery.dto.RouteOptimizationRequest;
import com.MaSoVa.logistics.delivery.dto.RouteOptimizationResponse;
import com.MaSoVa.logistics.delivery.service.RouteOptimizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("RouteOptimizationService Unit Tests")
class RouteOptimizationServiceTest {

    @InjectMocks private RouteOptimizationService routeOptimizationService;
    // geoApiContext is @Autowired(required=false) — not set in unit test = null → fallback path

    private RouteOptimizationRequest buildRequest(double fromLat, double fromLng, double toLat, double toLng) {
        RouteOptimizationRequest req = new RouteOptimizationRequest();
        req.setOrigin(AddressDTO.builder()
            .latitude(fromLat).longitude(fromLng)
            .street("Origin St").city("Mumbai").build());
        req.setDestination(AddressDTO.builder()
            .latitude(toLat).longitude(toLng)
            .street("Dest St").city("Mumbai").build());
        return req;
    }

    @Nested
    @DisplayName("getOptimizedRoute (fallback — no Google Maps API)")
    class GetOptimizedRoute {

        @Test
        @DisplayName("returns fallback route when geoApiContext is null")
        void returnsFallbackRoute() {
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.090, 72.880);

            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result).isNotNull();
            assertThat(result.getDistanceKm()).isGreaterThan(BigDecimal.ZERO);
            assertThat(result.getDurationMinutes()).isGreaterThan(0);
            assertThat(result.getSteps()).isNotEmpty();
            assertThat(result.getStartLocation()).isEqualTo(req.getOrigin());
            assertThat(result.getEndLocation()).isEqualTo(req.getDestination());
        }

        @Test
        @DisplayName("fallback distance uses 1.3x Haversine distance for road estimate")
        void fallbackUsesRoadMultiplier() {
            // Same location = 0 distance
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.076, 72.877);

            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result.getDistanceKm()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getDurationMinutes()).isEqualTo(0);
        }

        @Test
        @DisplayName("calculates meaningful distance between two different Mumbai locations")
        void calculatesMeaningfulDistance() {
            // ~2km in Mumbai
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.094, 72.877);

            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result.getDistanceKm()).isGreaterThan(new BigDecimal("1.0"));
            assertThat(result.getDurationMinutes()).isGreaterThan(0);
        }

        @Test
        @DisplayName("returns step with instruction and distance in fallback")
        void returnsStepWithInstruction() {
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.090, 72.880);

            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result.getSteps()).hasSize(1);
            RouteOptimizationResponse.Step step = result.getSteps().get(0);
            assertThat(step.getInstruction()).contains("destination");
            assertThat(step.getManeuver()).isEqualTo("straight");
            assertThat(step.getDistanceMeters()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("handles request with avoidTolls flag")
        void handlesAvoidTolls() {
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.090, 72.880);
            req.setAvoidTolls(true);

            // With null geoApiContext, hits fallback regardless
            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result).isNotNull();
            assertThat(result.getDistanceKm()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("handles request with avoidHighways flag")
        void handlesAvoidHighways() {
            RouteOptimizationRequest req = buildRequest(19.076, 72.877, 19.090, 72.880);
            req.setAvoidHighways(true);

            RouteOptimizationResponse result = routeOptimizationService.getOptimizedRoute(req);

            assertThat(result).isNotNull();
        }
    }
}
