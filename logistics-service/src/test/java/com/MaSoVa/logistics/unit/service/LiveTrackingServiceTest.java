package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.dto.LocationUpdateRequest;
import com.MaSoVa.logistics.delivery.dto.TrackingResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.entity.DriverLocation;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.repository.DriverLocationRepository;
import com.MaSoVa.logistics.delivery.service.ETACalculationService;
import com.MaSoVa.logistics.delivery.service.LiveTrackingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("LiveTrackingService Unit Tests")
class LiveTrackingServiceTest {

    @Mock private DriverLocationRepository driverLocationRepository;
    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private ETACalculationService etaCalculationService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks private LiveTrackingService liveTrackingService;

    @Nested
    @DisplayName("updateDriverLocation")
    class UpdateDriverLocation {

        @Test
        @DisplayName("saves location and broadcasts via WebSocket")
        void savesAndBroadcasts() {
            LocationUpdateRequest req = new LocationUpdateRequest();
            req.setDriverId("driver-1");
            req.setLatitude(19.076);
            req.setLongitude(72.877);
            req.setAccuracy(5.0);
            req.setSpeed(30.0);
            req.setHeading(45.0);
            req.setTimestamp(LocalDateTime.now());

            DriverLocation savedLoc = DriverLocation.builder()
                .driverId("driver-1").latitude(19.076).longitude(72.877).build();
            when(driverLocationRepository.save(any())).thenReturn(savedLoc);

            liveTrackingService.updateDriverLocation(req);

            verify(driverLocationRepository).save(any());
            verify(messagingTemplate).convertAndSend(anyString(), (Object) any());
        }

        @Test
        @DisplayName("uses current time when request timestamp is null")
        void usesCurrentTimeWhenTimestampNull() {
            LocationUpdateRequest req = new LocationUpdateRequest();
            req.setDriverId("driver-1");
            req.setLatitude(19.076);
            req.setLongitude(72.877);
            req.setTimestamp(null);

            DriverLocation savedLoc = DriverLocation.builder()
                .driverId("driver-1").latitude(19.076).longitude(72.877).build();
            when(driverLocationRepository.save(any())).thenReturn(savedLoc);

            liveTrackingService.updateDriverLocation(req);

            verify(driverLocationRepository).save(any());
        }
    }

    @Nested
    @DisplayName("getOrderTracking")
    class GetOrderTracking {

        @Test
        @DisplayName("returns tracking response with driver location when found")
        void returnsTrackingWithLocation() {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setOrderId("order-1");
            tracking.setDriverId("driver-1");
            tracking.setDriverName("John Driver");
            tracking.setDriverPhone("9876543210");
            tracking.setStatus("IN_TRANSIT");

            DriverLocation location = DriverLocation.builder()
                .driverId("driver-1")
                .latitude(19.076)
                .longitude(72.877)
                .timestamp(LocalDateTime.now())
                .build();

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            TrackingResponse result = liveTrackingService.getOrderTracking("order-1");

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getOrderStatus()).isEqualTo("IN_TRANSIT");
            assertThat(result.getDriver().getDriverId()).isEqualTo("driver-1");
            assertThat(result.getCurrentLocation()).isNotNull();
            assertThat(result.getCurrentLocation().getLatitude()).isEqualTo(19.076);
        }

        @Test
        @DisplayName("returns tracking without location when no GPS data")
        void returnsTrackingWithoutLocation() {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setOrderId("order-1");
            tracking.setDriverId("driver-1");
            tracking.setDriverName("John Driver");
            tracking.setStatus("ASSIGNED");

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.empty());

            TrackingResponse result = liveTrackingService.getOrderTracking("order-1");

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getCurrentLocation()).isNull();
            assertThat(result.getEstimatedArrivalMinutes()).isNull();
        }

        @Test
        @DisplayName("throws when tracking not found for order")
        void throwsWhenNotFound() {
            when(deliveryTrackingRepository.findByOrderId("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> liveTrackingService.getOrderTracking("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Tracking not found");
        }

        @Test
        @DisplayName("calculates ETA and distance when delivery address is set")
        void calculatesEtaWithDeliveryAddress() {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setOrderId("order-1");
            tracking.setDriverId("driver-1");
            tracking.setDriverName("John Driver");
            tracking.setStatus("IN_TRANSIT");
            // Add delivery address
            DeliveryTracking.DeliveryAddress addr = DeliveryTracking.DeliveryAddress.builder()
                .latitude(19.090).longitude(72.880).build();
            tracking.setDeliveryAddress(addr);

            DriverLocation location = DriverLocation.builder()
                .driverId("driver-1")
                .latitude(19.076)
                .longitude(72.877)
                .timestamp(LocalDateTime.now())
                .build();

            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(driverLocationRepository.findTopByDriverIdOrderByTimestampDesc("driver-1"))
                .thenReturn(Optional.of(location));

            TrackingResponse result = liveTrackingService.getOrderTracking("order-1");

            assertThat(result.getEstimatedArrivalMinutes()).isNotNull();
            assertThat(result.getDistanceRemainingKm()).isNotNull();
        }
    }
}
