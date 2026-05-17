package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.client.OrderServiceClient;
import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.AddressDTO;
import com.MaSoVa.logistics.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.logistics.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.service.AutoDispatchService;
import com.MaSoVa.logistics.delivery.service.FreeRoutingService;
import com.MaSoVa.logistics.delivery.service.RouteOptimizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AutoDispatchService Unit Tests")
class AutoDispatchServiceTest {

    @Mock private UserServiceClient userServiceClient;
    @Mock private OrderServiceClient orderServiceClient;
    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private RouteOptimizationService routeOptimizationService;
    @Mock private FreeRoutingService freeRoutingService;

    @InjectMocks private AutoDispatchService autoDispatchService;

    private AutoDispatchRequest buildRequest(String orderId, String storeId) {
        AutoDispatchRequest req = new AutoDispatchRequest();
        req.setOrderId(orderId);
        req.setStoreId(storeId);
        AddressDTO addr = AddressDTO.builder()
            .street("123 Main St").city("Mumbai").state("MH")
            .zipCode("400001").latitude(19.076).longitude(72.877)
            .build();
        req.setDeliveryAddress(addr);
        return req;
    }

    private Map<String, Object> buildDriver(String id, double rating) {
        return Map.of(
            "id", id,
            "name", "Driver " + id,
            "phone", "98765" + id,
            "rating", rating,
            "latitude", 19.076,
            "longitude", 72.877
        );
    }

    @Nested
    @DisplayName("autoDispatch")
    class AutoDispatch {

        @Test
        @DisplayName("throws when delivery address is missing")
        void throwsWhenNoDeliveryAddress() {
            AutoDispatchRequest req = new AutoDispatchRequest();
            req.setOrderId("order-1");
            req.setStoreId("store-1");
            // no delivery address set

            assertThatThrownBy(() -> autoDispatchService.autoDispatch(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Delivery address is required");
        }

        @Test
        @DisplayName("throws when no available drivers")
        void throwsWhenNoDrivers() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");
            when(userServiceClient.getAvailableDrivers("store-1")).thenReturn(List.of());

            assertThatThrownBy(() -> autoDispatchService.autoDispatch(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No available drivers");
        }

        @Test
        @DisplayName("dispatches to best available driver using AUTO method")
        void dispatchesToBestDriver() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");

            Map<String, Object> driver1 = buildDriver("driver-1", 4.5);
            Map<String, Object> driver2 = buildDriver("driver-2", 3.5);

            when(userServiceClient.getAvailableDrivers("store-1"))
                .thenReturn(List.of(driver1, driver2));
            when(userServiceClient.getDriverLastLocation(anyString()))
                .thenReturn(Map.of("latitude", 19.076, "longitude", 72.877));
            when(deliveryTrackingRepository.findByDriverIdAndStatus(anyString(), anyString()))
                .thenReturn(List.of());
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(orderServiceClient).assignDriverToOrder(anyString(), anyString());

            FreeRoutingService.RouteResult route = new FreeRoutingService.RouteResult(2500.0, 480.0, List.of(), List.of());
            when(freeRoutingService.getRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(route);

            AutoDispatchResponse result = autoDispatchService.autoDispatch(req);

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getDriverId()).isNotNull();
            assertThat(result.getDispatchMethod()).isEqualTo("AUTO");
            assertThat(result.getStatus()).isEqualTo("ASSIGNED");
        }

        @Test
        @DisplayName("assigns preferred driver directly when preferredDriverId is set")
        void assignsPreferredDriver() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");
            req.setPreferredDriverId("driver-preferred");

            Map<String, Object> driver = buildDriver("driver-preferred", 4.8);
            when(userServiceClient.getDriverDetails("driver-preferred")).thenReturn(driver);
            when(userServiceClient.getDriverLastLocation("driver-preferred"))
                .thenReturn(Map.of("latitude", 19.076, "longitude", 72.877));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(orderServiceClient).assignDriverToOrder(anyString(), anyString());

            FreeRoutingService.RouteResult route = new FreeRoutingService.RouteResult(3000.0, 600.0, List.of(), List.of());
            when(freeRoutingService.getRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(route);

            AutoDispatchResponse result = autoDispatchService.autoDispatch(req);

            assertThat(result.getDriverId()).isEqualTo("driver-preferred");
            assertThat(result.getDispatchMethod()).isEqualTo("MANUAL");
        }

        @Test
        @DisplayName("throws when preferred driver not found")
        void throwsWhenPreferredDriverNotFound() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");
            req.setPreferredDriverId("driver-missing");

            when(userServiceClient.getDriverDetails("driver-missing")).thenReturn(Map.of());

            assertThatThrownBy(() -> autoDispatchService.autoDispatch(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Preferred driver not found");
        }

        @Test
        @DisplayName("falls back to Haversine when OSRM routing fails")
        void fallsBackToHaversineOnOsrmFailure() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");

            Map<String, Object> driver = buildDriver("driver-1", 4.5);
            when(userServiceClient.getAvailableDrivers("store-1")).thenReturn(List.of(driver));
            when(userServiceClient.getDriverLastLocation("driver-1"))
                .thenReturn(Map.of("latitude", 19.076, "longitude", 72.877));
            when(deliveryTrackingRepository.findByDriverIdAndStatus(anyString(), anyString()))
                .thenReturn(List.of());
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(orderServiceClient).assignDriverToOrder(anyString(), anyString());

            // OSRM fails — falls back to Haversine
            when(freeRoutingService.getRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("OSRM unavailable"));

            AutoDispatchResponse result = autoDispatchService.autoDispatch(req);

            assertThat(result.getOrderId()).isEqualTo("order-1");
            assertThat(result.getStatus()).isEqualTo("ASSIGNED");
        }

        @Test
        @DisplayName("uses default location (0,0) when driver has no GPS data")
        void usesDefaultLocationWhenNoGps() {
            AutoDispatchRequest req = buildRequest("order-1", "store-1");

            Map<String, Object> driver = buildDriver("driver-1", 4.0);
            when(userServiceClient.getAvailableDrivers("store-1")).thenReturn(List.of(driver));
            when(userServiceClient.getDriverLastLocation("driver-1")).thenReturn(Map.of()); // no GPS
            when(deliveryTrackingRepository.findByDriverIdAndStatus(anyString(), anyString()))
                .thenReturn(List.of());
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(orderServiceClient).assignDriverToOrder(anyString(), anyString());

            FreeRoutingService.RouteResult route = new FreeRoutingService.RouteResult(50000.0, 6000.0, List.of(), List.of());
            when(freeRoutingService.getRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(route);

            AutoDispatchResponse result = autoDispatchService.autoDispatch(req);

            assertThat(result.getDriverId()).isEqualTo("driver-1");
        }
    }
}
