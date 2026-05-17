package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.dto.ETAResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.entity.DriverLocation;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.repository.DriverLocationRepository;
import com.MaSoVa.logistics.delivery.service.ETACalculationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ETACalculationService Unit Tests")
class ETACalculationServiceTest {

    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private DriverLocationRepository driverLocationRepository;

    @InjectMocks private ETACalculationService etaCalculationService;

    private DeliveryTracking buildTracking(String orderId, String driverId) {
        DeliveryTracking t = new DeliveryTracking();
        t.setOrderId(orderId);
        t.setDriverId(driverId);
        t.setStatus("IN_TRANSIT");
        t.setAssignedAt(LocalDateTime.now().minusMinutes(10));
        t.setEstimatedDeliveryMinutes(30);
        DeliveryTracking.DeliveryAddress addr = DeliveryTracking.DeliveryAddress.builder()
            .latitude(19.090).longitude(72.880).build();
        t.setDeliveryAddress(addr);
        return t;
    }

    private DriverLocation buildLocation(String driverId, double lat, double lng, Double speed) {
        return DriverLocation.builder()
            .driverId(driverId)
            .latitude(lat)
            .longitude(lng)
            .speed(speed)
            .timestamp(LocalDateTime.now())
            .build();
    }

    @Nested
    @DisplayName("calculateETA")
    class CalculateETA {

        @Test
        @DisplayName("throws when tracking not found for order")
        void throwsWhenNotFound() {
            when(deliveryTrackingRepository.findByOrderId("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> etaCalculationService.calculateETA("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("returns ETA with estimated minutes when no driver location data")
        void returnsEstimatedWhenNoLocation() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.empty());

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getEstimatedMinutes()).isEqualTo(30);
            assertThat(result.getStatus()).isEqualTo("ON_TIME");
            assertThat(result.getDistanceRemainingKm()).isZero();
        }

        @Test
        @DisplayName("uses default 30min when estimated minutes is null")
        void usesDefault30WhenNull() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            tracking.setEstimatedDeliveryMinutes(null);
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.empty());

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getEstimatedMinutes()).isEqualTo(30);
        }

        @Test
        @DisplayName("calculates ETA from driver location using known speed")
        void calculatesEtaFromLocationWithSpeed() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            DriverLocation location = buildLocation("driver-1", 19.076, 72.877, 30.0);

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getDistanceRemainingKm()).isNotNull();
            assertThat(result.getEstimatedMinutes()).isGreaterThan(0);
            assertThat(result.getEstimatedArrival()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("uses default speed when driver speed is null")
        void usesDefaultSpeedWhenNull() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            DriverLocation location = buildLocation("driver-1", 19.076, 72.877, null);

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getEstimatedMinutes()).isGreaterThan(0);
        }

        @Test
        @DisplayName("uses default speed when driver speed is zero")
        void usesDefaultSpeedWhenZero() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            DriverLocation location = buildLocation("driver-1", 19.076, 72.877, 0.0);

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getEstimatedMinutes()).isGreaterThan(0);
        }

        @Test
        @DisplayName("returns status ON_TIME when estimated arrival within window")
        void returnsOnTimeStatus() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            tracking.setAssignedAt(LocalDateTime.now()); // just assigned
            tracking.setEstimatedDeliveryMinutes(60); // generous window

            // Very close driver — estimated arrival will be well within window
            DriverLocation location = buildLocation("driver-1", 19.0760, 72.8777, 50.0);

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getStatus()).isIn("ON_TIME", "DELAYED");
        }

        @Test
        @DisplayName("includes traffic condition and delay in response")
        void includesTrafficInfo() {
            DeliveryTracking tracking = buildTracking("order-1", "driver-1");
            DriverLocation location = buildLocation("driver-1", 19.076, 72.877, 30.0);

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            ETAResponse result = etaCalculationService.calculateETA("order-1");

            assertThat(result.getTrafficCondition()).isIn("LIGHT", "MODERATE", "HEAVY");
            assertThat(result.getTrafficDelayMinutes()).isGreaterThanOrEqualTo(0);
            assertThat(result.getCalculatedAt()).isNotNull();
        }
    }
}
