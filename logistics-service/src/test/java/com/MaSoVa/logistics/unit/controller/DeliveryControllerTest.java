package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.controller.DeliveryController;
import com.MaSoVa.logistics.delivery.dto.*;
import com.MaSoVa.logistics.delivery.service.*;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeliveryController Unit Tests")
class DeliveryControllerTest extends BaseServiceTest {

    @Mock private AutoDispatchService autoDispatchService;
    @Mock private RouteOptimizationService routeOptimizationService;
    @Mock private DeliveryZoneService deliveryZoneService;
    @Mock private UserServiceClient userServiceClient;
    @Mock private LiveTrackingService liveTrackingService;
    @Mock private ETACalculationService etaCalculationService;
    @Mock private ProofOfDeliveryService proofOfDeliveryService;
    @Mock private DriverAcceptanceService driverAcceptanceService;
    @Mock private PerformanceService performanceService;

    @InjectMocks private DeliveryController deliveryController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(deliveryController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Nested
    @DisplayName("GET /api/delivery/track/{orderId}")
    class TrackOrder {

        @Test
        @DisplayName("returns 200 for public tracking (no auth)")
        void returns200() throws Exception {
            when(liveTrackingService.getOrderTracking("order-1")).thenReturn(new TrackingResponse());

            mockMvc.perform(get("/api/delivery/track/order-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/{orderId}/otp")
    class GenerateOtp {

        @Test
        @DisplayName("returns 200 with OTP string")
        void returns200() throws Exception {
            when(proofOfDeliveryService.generateDeliveryOtp("order-1")).thenReturn("4321");

            mockMvc.perform(post("/api/delivery/order-1/otp"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/accept")
    class AcceptDelivery {

        @Test
        @DisplayName("returns 200 when driver accepts")
        void returns200() throws Exception {
            when(driverAcceptanceService.acceptDelivery(any())).thenReturn(new DriverAcceptanceResponse());

            mockMvc.perform(post("/api/delivery/accept")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"trackingId\":\"track-1\",\"driverId\":\"driver-1\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/reject")
    class RejectDelivery {

        @Test
        @DisplayName("returns 200 when driver rejects")
        void returns200() throws Exception {
            when(driverAcceptanceService.rejectDelivery(any())).thenReturn(new DriverAcceptanceResponse());

            mockMvc.perform(post("/api/delivery/reject")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"trackingId\":\"track-1\",\"driverId\":\"driver-1\",\"reason\":\"Too far\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/zones")
    class DeliveryZones {

        @Test
        @DisplayName("returns 200 with zones list")
        void returns200() throws Exception {
            when(deliveryZoneService.getDeliveryZones("store-1"))
                .thenReturn(List.of(Map.of("zone", "ZONE_A", "feeINR", 29)));

            mockMvc.perform(get("/api/delivery/zones").param("storeId", "store-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/drivers/available")
    class AvailableDrivers {

        @Test
        @DisplayName("returns 200 with available drivers list")
        void returns200() throws Exception {
            when(userServiceClient.getAvailableDrivers("store-1"))
                .thenReturn(List.of(Map.of("id", "driver-1", "status", "AVAILABLE")));

            mockMvc.perform(get("/api/delivery/drivers/available").param("storeId", "store-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/location")
    class UpdateLocation {

        @Test
        @DisplayName("returns 200 on location update")
        void returns200() throws Exception {
            doNothing().when(liveTrackingService).updateDriverLocation(any());

            mockMvc.perform(post("/api/delivery/location")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"driverId\":\"driver-1\",\"latitude\":19.076,\"longitude\":72.877}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }
    }
}
