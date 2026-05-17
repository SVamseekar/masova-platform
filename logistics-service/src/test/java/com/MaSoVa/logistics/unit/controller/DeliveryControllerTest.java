package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.controller.DeliveryController;
import com.MaSoVa.logistics.delivery.dto.*;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
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
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
    @DisplayName("POST /api/delivery/dispatch")
    class Dispatch {

        @Test
        @DisplayName("returns 201 when store matches header")
        void returns201WhenStoreMatches() throws Exception {
            AutoDispatchResponse response = new AutoDispatchResponse();
            response.setDriverId("driver-1");
            when(autoDispatchService.autoDispatch(any())).thenReturn(response);

            mockMvc.perform(post("/api/delivery/dispatch")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"storeId\":\"store-1\"}"))
                .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("returns 403 when storeId in body does not match header")
        void returns403WhenStoreMismatch() throws Exception {
            mockMvc.perform(post("/api/delivery/dispatch")
                    .header("X-User-Store-Id", "store-other")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"storeId\":\"store-1\"}"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/route")
    class OptimiseRoute {

        @Test
        @DisplayName("returns 200 with optimized route")
        void returns200() throws Exception {
            when(routeOptimizationService.getOptimizedRoute(any()))
                .thenReturn(new RouteOptimizationResponse());

            mockMvc.perform(post("/api/delivery/route")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"driverId\":\"driver-1\",\"stops\":[]}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/accept")
    class AcceptDelivery {

        @Test
        @DisplayName("returns 200 when driver accepts")
        void returns200() throws Exception {
            DriverAcceptanceResponse resp = new DriverAcceptanceResponse();
            resp.setStatus("ACCEPTED");
            when(driverAcceptanceService.acceptDelivery(any())).thenReturn(resp);

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
            DriverAcceptanceResponse resp = new DriverAcceptanceResponse();
            resp.setStatus("REJECTED");
            when(driverAcceptanceService.rejectDelivery(any())).thenReturn(resp);

            mockMvc.perform(post("/api/delivery/reject")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"trackingId\":\"track-1\",\"driverId\":\"driver-1\",\"reason\":\"Too far\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/location")
    class UpdateLocation {

        @Test
        @DisplayName("returns 200 with success flag")
        void returns200() throws Exception {
            doNothing().when(liveTrackingService).updateDriverLocation(any());

            mockMvc.perform(post("/api/delivery/location")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"driverId\":\"driver-1\",\"latitude\":19.076,\"longitude\":72.877}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.driverId").value("driver-1"));
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/track/{orderId}")
    class TrackOrder {

        @Test
        @DisplayName("returns 200 for public tracking (no auth)")
        void returns200() throws Exception {
            TrackingResponse tracking = new TrackingResponse();
            when(liveTrackingService.getOrderTracking("order-1")).thenReturn(tracking);

            mockMvc.perform(get("/api/delivery/track/order-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/verify")
    class VerifyDelivery {

        @Test
        @DisplayName("verifies OTP delivery by default")
        void verifiesOtpByDefault() throws Exception {
            when(proofOfDeliveryService.verifyDeliveryOtp(any()))
                .thenReturn(new DeliveryVerificationResponse());

            mockMvc.perform(post("/api/delivery/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"otp\":\"1234\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("verifies photo delivery when type=photo")
        void verifiesPhoto() throws Exception {
            when(proofOfDeliveryService.verifyDeliveryWithPhoto(any()))
                .thenReturn(new DeliveryVerificationResponse());

            mockMvc.perform(post("/api/delivery/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"proofType\":\"photo\",\"photoUrl\":\"http://example.com/photo.jpg\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("verifies signature delivery when type=signature")
        void verifiesSignature() throws Exception {
            when(proofOfDeliveryService.verifyDeliveryWithSignature(any()))
                .thenReturn(new DeliveryVerificationResponse());

            mockMvc.perform(post("/api/delivery/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"proofType\":\"signature\",\"signatureUrl\":\"http://example.com/sig.png\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("marks contactless delivery when type=contactless")
        void verifiesContactless() throws Exception {
            when(proofOfDeliveryService.markContactlessDelivery(any()))
                .thenReturn(new DeliveryVerificationResponse());

            mockMvc.perform(post("/api/delivery/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"proofType\":\"contactless\"}"))
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
    @DisplayName("GET /api/delivery/driver/{driverId}/pending")
    class PendingDeliveries {

        @Test
        @DisplayName("returns 200 with list of pending deliveries")
        void returns200() throws Exception {
            when(driverAcceptanceService.getPendingDeliveriesForDriver("driver-1"))
                .thenReturn(List.of(new DeliveryTracking()));

            mockMvc.perform(get("/api/delivery/driver/driver-1/pending"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 with empty list when no pending deliveries")
        void returns200WithEmpty() throws Exception {
            when(driverAcceptanceService.getPendingDeliveriesForDriver("driver-2"))
                .thenReturn(List.of());

            mockMvc.perform(get("/api/delivery/driver/driver-2/pending"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/driver/{driverId}/performance")
    class DriverPerformance {

        @Test
        @DisplayName("returns 200 with performance data (no date params)")
        void returns200NoDateParams() throws Exception {
            when(performanceService.getDriverPerformance(anyString(), isNull(), any(), any()))
                .thenReturn(new DriverPerformanceResponse());

            mockMvc.perform(get("/api/delivery/driver/driver-1/performance"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 with date range params")
        void returns200WithDateRange() throws Exception {
            when(performanceService.getDriverPerformance(anyString(), isNull(), any(), any()))
                .thenReturn(new DriverPerformanceResponse());

            mockMvc.perform(get("/api/delivery/driver/driver-1/performance")
                    .param("startDate", "2026-05-01")
                    .param("endDate", "2026-05-17"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/zones")
    class DeliveryZones {

        @Test
        @DisplayName("returns zone list when no check/fee params")
        void returnsZoneList() throws Exception {
            when(deliveryZoneService.getDeliveryZones("store-1"))
                .thenReturn(List.of(Map.of("zone", "ZONE_A", "feeINR", 29)));

            mockMvc.perform(get("/api/delivery/zones").param("storeId", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns fee response when fee=true with lat/lng")
        void returnsFee() throws Exception {
            DeliveryFeeResponse feeResp = DeliveryFeeResponse.builder()
                .success(true).zoneName("A").deliveryFeeINR(29.0).build();
            when(deliveryZoneService.calculateDeliveryFee(eq("store-1"), eq(19.076), eq(72.877)))
                .thenReturn(feeResp);

            mockMvc.perform(get("/api/delivery/zones")
                    .param("storeId", "store-1")
                    .param("lat", "19.076")
                    .param("lng", "72.877")
                    .param("fee", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns zone check result when check=true with lat/lng")
        void returnsZoneCheck() throws Exception {
            when(deliveryZoneService.isWithinDeliveryZone(eq("store-1"), eq(19.076), eq(72.877)))
                .thenReturn(true);

            mockMvc.perform(get("/api/delivery/zones")
                    .param("storeId", "store-1")
                    .param("lat", "19.076")
                    .param("lng", "72.877")
                    .param("check", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isWithinDeliveryZone").value(true));
        }

        @Test
        @DisplayName("returns address validation when check=true with pincode")
        void returnsAddressValidation() throws Exception {
            DeliveryZoneService.ValidationResult vr = new DeliveryZoneService.ValidationResult();
            vr.setValid(true);
            when(deliveryZoneService.validateDeliveryAddress(anyString(), anyDouble(), anyDouble(), anyString()))
                .thenReturn(vr);

            mockMvc.perform(get("/api/delivery/zones")
                    .param("storeId", "store-1")
                    .param("lat", "19.076")
                    .param("lng", "72.877")
                    .param("check", "true")
                    .param("pincode", "400001"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/delivery/{trackingId}/status")
    class UpdateTrackingStatus {

        @Test
        @DisplayName("returns 200 when status=PICKED_UP")
        void pickedUp() throws Exception {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setStatus("PICKED_UP");
            when(driverAcceptanceService.markAsPickedUp(eq("track-1"), anyString()))
                .thenReturn(tracking);

            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"PICKED_UP\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 when status=IN_TRANSIT")
        void inTransit() throws Exception {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setStatus("IN_TRANSIT");
            when(driverAcceptanceService.markAsInTransit(eq("track-1"), anyString()))
                .thenReturn(tracking);

            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"IN_TRANSIT\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 when status=ARRIVED")
        void arrived() throws Exception {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setStatus("ARRIVED");
            when(driverAcceptanceService.markAsArrived(eq("track-1"), anyString()))
                .thenReturn(tracking);

            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"ARRIVED\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 when status=DELIVERED")
        void delivered() throws Exception {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.setStatus("DELIVERED");
            when(driverAcceptanceService.markAsDelivered(eq("track-1"), anyString(), isNull()))
                .thenReturn(tracking);

            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for unknown status")
        void returns400ForUnknownStatus() throws Exception {
            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"UNKNOWN\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("uses driverId from body over header")
        void usesDriverIdFromBody() throws Exception {
            DeliveryTracking tracking = new DeliveryTracking();
            when(driverAcceptanceService.markAsPickedUp(eq("track-1"), eq("driver-body")))
                .thenReturn(tracking);

            mockMvc.perform(post("/api/delivery/track-1/status")
                    .header("X-Driver-Id", "driver-header")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"PICKED_UP\",\"driverId\":\"driver-body\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/delivery/driver/{driverId}/status")
    class UpdateDriverStatus {

        @Test
        @DisplayName("returns 200 when going AVAILABLE and session active")
        void returns200WhenAvailable() throws Exception {
            when(userServiceClient.getEmployeeWorkingStatus("driver-1"))
                .thenReturn(Map.of("active", true));
            doNothing().when(userServiceClient).updateDriverStatus("driver-1", "AVAILABLE");

            mockMvc.perform(patch("/api/delivery/driver/driver-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
        }

        @Test
        @DisplayName("returns 403 when going AVAILABLE but not clocked in")
        void returns403WhenNotClockedIn() throws Exception {
            when(userServiceClient.getEmployeeWorkingStatus("driver-1"))
                .thenReturn(Map.of("active", false));

            mockMvc.perform(patch("/api/delivery/driver/driver-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.requiresClockIn").value(true));
        }

        @Test
        @DisplayName("returns 200 when going OFF_DUTY")
        void returns200WhenOffDuty() throws Exception {
            doNothing().when(userServiceClient).updateDriverStatus("driver-1", "OFF_DUTY");

            mockMvc.perform(patch("/api/delivery/driver/driver-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"OFF_DUTY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OFF_DUTY"));
        }

        @Test
        @DisplayName("returns 400 for invalid status")
        void returns400ForInvalidStatus() throws Exception {
            mockMvc.perform(patch("/api/delivery/driver/driver-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"ON_BREAK\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("proceeds to AVAILABLE when working session check throws")
        void proceedsWhenSessionCheckThrows() throws Exception {
            when(userServiceClient.getEmployeeWorkingStatus("driver-1"))
                .thenThrow(new RuntimeException("Service unavailable"));
            doNothing().when(userServiceClient).updateDriverStatus("driver-1", "AVAILABLE");

            mockMvc.perform(patch("/api/delivery/driver/driver-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/driver/{driverId}/status")
    class GetDriverStatus {

        @Test
        @DisplayName("returns 200 with AVAILABLE status")
        void returnsAvailableStatus() throws Exception {
            when(userServiceClient.getDriverStatus("driver-1")).thenReturn("AVAILABLE");

            mockMvc.perform(get("/api/delivery/driver/driver-1/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverId").value("driver-1"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.isOnline").value(true));
        }

        @Test
        @DisplayName("returns OFF_DUTY when status is null")
        void returnsOffDutyWhenNull() throws Exception {
            when(userServiceClient.getDriverStatus("driver-1")).thenReturn(null);

            mockMvc.perform(get("/api/delivery/driver/driver-1/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OFF_DUTY"))
                .andExpect(jsonPath("$.isOnline").value(false));
        }
    }

    @Nested
    @DisplayName("GET /api/delivery/metrics")
    class GetMetrics {

        @Test
        @DisplayName("returns 200 with today metrics")
        void returns200() throws Exception {
            when(performanceService.getTodayMetrics(isNull()))
                .thenReturn(new DeliveryMetricsResponse());

            mockMvc.perform(get("/api/delivery/metrics"))
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
    @DisplayName("POST /api/delivery/gdpr/anonymize")
    class GdprAnonymize {

        @Test
        @DisplayName("returns 200 when called with X-Internal-Service header")
        void returns200WithInternalHeader() throws Exception {
            mockMvc.perform(post("/api/delivery/gdpr/anonymize")
                    .param("customerId", "customer-1")
                    .header("X-Internal-Service", "core-service"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 403 when X-Internal-Service header is missing")
        void returns403WithoutInternalHeader() throws Exception {
            mockMvc.perform(post("/api/delivery/gdpr/anonymize")
                    .param("customerId", "customer-1"))
                .andExpect(status().isForbidden());
        }
    }
}
