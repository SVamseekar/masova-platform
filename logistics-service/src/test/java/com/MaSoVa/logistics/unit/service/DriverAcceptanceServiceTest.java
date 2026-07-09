package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.client.OrderServiceClient;
import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.DriverAcceptanceRequest;
import com.MaSoVa.logistics.delivery.dto.DriverAcceptanceResponse;
import com.MaSoVa.logistics.delivery.dto.DriverRejectionRequest;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.service.AutoDispatchService;
import com.MaSoVa.logistics.delivery.service.DriverAcceptanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DriverAcceptanceService Unit Tests")
class DriverAcceptanceServiceTest {

    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private UserServiceClient userServiceClient;
    @Mock private OrderServiceClient orderServiceClient;
    @Mock private AutoDispatchService autoDispatchService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks private DriverAcceptanceService driverAcceptanceService;

    private DeliveryTracking buildTracking(String id, String driverId, String status) {
        DeliveryTracking tracking = new DeliveryTracking();
        tracking.setId(id);
        tracking.setOrderId("order-1");
        tracking.setStoreId("store-1");
        tracking.setDriverId(driverId);
        tracking.setDriverName("John Driver");
        tracking.setStatus(status);
        tracking.setAssignedAt(LocalDateTime.now().minusMinutes(2));
        tracking.setReassignmentCount(0);
        return tracking;
    }

    @Nested
    @DisplayName("acceptDelivery")
    class AcceptDelivery {

        @Test
        @DisplayName("accepts delivery and returns ACCEPTED response")
        void acceptsDelivery() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DriverAcceptanceRequest request = new DriverAcceptanceRequest();
            request.setTrackingId("track-1");
            request.setDriverId("driver-1");

            DriverAcceptanceResponse response = driverAcceptanceService.acceptDelivery(request);

            assertThat(response.getStatus()).isEqualTo("ACCEPTED");
            assertThat(response.getDriverId()).isEqualTo("driver-1");
            verify(deliveryTrackingRepository).save(any());
        }

        @Test
        @DisplayName("sets estimated delivery minutes when estimatedPickupMinutes provided")
        void setsEstimatedMinutes() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DriverAcceptanceRequest request = new DriverAcceptanceRequest();
            request.setTrackingId("track-1");
            request.setDriverId("driver-1");
            request.setEstimatedPickupMinutes(10);

            DriverAcceptanceResponse response = driverAcceptanceService.acceptDelivery(request);

            assertThat(response.getEstimatedDeliveryMinutes()).isEqualTo(25); // 10 + 15
        }

        @Test
        @DisplayName("throws when tracking not found")
        void throwsWhenNotFound() {
            when(deliveryTrackingRepository.findById("missing")).thenReturn(Optional.empty());

            DriverAcceptanceRequest request = new DriverAcceptanceRequest();
            request.setTrackingId("missing");
            request.setDriverId("driver-1");

            assertThatThrownBy(() -> driverAcceptanceService.acceptDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when driver is not the assigned driver")
        void throwsWhenWrongDriver() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-correct", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            DriverAcceptanceRequest request = new DriverAcceptanceRequest();
            request.setTrackingId("track-1");
            request.setDriverId("driver-wrong");

            assertThatThrownBy(() -> driverAcceptanceService.acceptDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not assigned");
        }

        @Test
        @DisplayName("throws when status is not ASSIGNED")
        void throwsWhenWrongStatus() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ACCEPTED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            DriverAcceptanceRequest request = new DriverAcceptanceRequest();
            request.setTrackingId("track-1");
            request.setDriverId("driver-1");

            assertThatThrownBy(() -> driverAcceptanceService.acceptDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot be accepted");
        }
    }

    @Nested
    @DisplayName("rejectDelivery")
    class RejectDelivery {

        @Test
        @DisplayName("rejects delivery and triggers reassignment when under max attempts")
        void rejectsDeliveryWithReassignment() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            tracking.setReassignmentCount(0);
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userServiceClient.getAvailableDrivers("store-1")).thenReturn(List.of());

            DriverRejectionRequest request = new DriverRejectionRequest("track-1", "driver-1", "Too far");

            DriverAcceptanceResponse response = driverAcceptanceService.rejectDelivery(request);

            assertThat(response.getStatus()).isEqualTo("REJECTED");
            assertThat(response.getDriverId()).isEqualTo("driver-1");
        }

        @Test
        @DisplayName("escalates to manager when max reassignment attempts reached")
        void escalatesToManagerOnMaxAttempts() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            tracking.setReassignmentCount(2); // already at 2, will become 3 = MAX
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DriverRejectionRequest request = new DriverRejectionRequest("track-1", "driver-1", "Traffic");

            DriverAcceptanceResponse response = driverAcceptanceService.rejectDelivery(request);

            assertThat(response.getStatus()).isEqualTo("REJECTED");
            assertThat(response.getMessage()).contains("manager");
            assertThat(response.isReassignmentTriggered()).isFalse();
        }

        @Test
        @DisplayName("throws when tracking not found")
        void throwsWhenNotFound() {
            when(deliveryTrackingRepository.findById("missing")).thenReturn(Optional.empty());

            DriverRejectionRequest request = new DriverRejectionRequest("missing", "driver-1", "Too far");

            assertThatThrownBy(() -> driverAcceptanceService.rejectDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when driver is not assigned")
        void throwsWhenWrongDriver() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-correct", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            DriverRejectionRequest request = new DriverRejectionRequest("track-1", "driver-wrong", "Reason");

            assertThatThrownBy(() -> driverAcceptanceService.rejectDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not assigned");
        }

        @Test
        @DisplayName("throws when status is not ASSIGNED")
        void throwsWhenWrongStatus() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ACCEPTED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            DriverRejectionRequest request = new DriverRejectionRequest("track-1", "driver-1", "Reason");

            assertThatThrownBy(() -> driverAcceptanceService.rejectDelivery(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot be rejected");
        }

        @Test
        @DisplayName("appends additionalNotes to rejection reason")
        void appendsAdditionalNotes() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userServiceClient.getAvailableDrivers("store-1")).thenReturn(List.of());

            DriverRejectionRequest request = new DriverRejectionRequest("track-1", "driver-1", "Too far");
            request.setAdditionalNotes("15km from my current location");

            driverAcceptanceService.rejectDelivery(request);

            verify(deliveryTrackingRepository).save(any(DeliveryTracking.class));
        }
    }

    @Nested
    @DisplayName("getActiveDeliveriesForDriver")
    class GetActiveDeliveries {

        @Test
        @DisplayName("returns in-progress deliveries for driver")
        void returnsActive() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ACCEPTED");
            when(deliveryTrackingRepository.findByDriverIdAndStatusIn(anyString(), any()))
                .thenReturn(List.of(tracking));

            List<DeliveryTracking> result = driverAcceptanceService.getActiveDeliveriesForDriver("driver-1");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("ACCEPTED");
        }
    }

    @Nested
    @DisplayName("listDeliveriesForStore")
    class ListDeliveriesForStore {

        @Test
        @DisplayName("lists all trackings for store when status omitted")
        void listsAll() {
            when(deliveryTrackingRepository.findByStoreId("store-1"))
                .thenReturn(List.of(buildTracking("t1", "d1", "ASSIGNED")));

            List<DeliveryTracking> result = driverAcceptanceService.listDeliveriesForStore("store-1", null);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("filters by status when provided")
        void filtersByStatus() {
            when(deliveryTrackingRepository.findByStatusAndStoreId("ASSIGNED", "store-1"))
                .thenReturn(List.of());

            List<DeliveryTracking> result = driverAcceptanceService.listDeliveriesForStore("store-1", "ASSIGNED");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getPendingDeliveriesForDriver")
    class GetPendingDeliveries {

        @Test
        @DisplayName("returns list of ASSIGNED deliveries for driver")
        void returnsPendingDeliveries() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            when(deliveryTrackingRepository.findByDriverIdAndStatus("driver-1", "ASSIGNED"))
                .thenReturn(List.of(tracking));

            List<DeliveryTracking> result = driverAcceptanceService.getPendingDeliveriesForDriver("driver-1");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDriverId()).isEqualTo("driver-1");
        }

        @Test
        @DisplayName("returns empty list when no pending deliveries")
        void returnsEmptyWhenNoPending() {
            when(deliveryTrackingRepository.findByDriverIdAndStatus("driver-2", "ASSIGNED"))
                .thenReturn(List.of());

            List<DeliveryTracking> result = driverAcceptanceService.getPendingDeliveriesForDriver("driver-2");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("markAsPickedUp")
    class MarkAsPickedUp {

        @Test
        @DisplayName("marks delivery as PICKED_UP")
        void marksPickedUp() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ACCEPTED");
            tracking.setOrderId("order-1");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsPickedUp("track-1", "driver-1");

            assertThat(result.getStatus()).isEqualTo("PICKED_UP");
            assertThat(result.getPickedUpAt()).isNotNull();
            verify(orderServiceClient).updateOrderDeliveryStatus("order-1", "OUT_FOR_DELIVERY");
        }

        @Test
        @DisplayName("does not throw when order status sync fails")
        void doesNotThrowWhenOrderSyncFails() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ACCEPTED");
            tracking.setOrderId("order-1");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            doThrow(new RuntimeException("order-service down"))
                    .when(orderServiceClient).updateOrderDeliveryStatus("order-1", "OUT_FOR_DELIVERY");

            DeliveryTracking result = driverAcceptanceService.markAsPickedUp("track-1", "driver-1");

            assertThat(result.getStatus()).isEqualTo("PICKED_UP");
        }

        @Test
        @DisplayName("throws when status is not ACCEPTED")
        void throwsWhenNotAccepted() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            assertThatThrownBy(() -> driverAcceptanceService.markAsPickedUp("track-1", "driver-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("accepted before pickup");
        }

        @Test
        @DisplayName("throws when wrong driver tries to mark pickup")
        void throwsWhenWrongDriver() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-correct", "ACCEPTED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            assertThatThrownBy(() -> driverAcceptanceService.markAsPickedUp("track-1", "driver-wrong"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not assigned");
        }
    }

    @Nested
    @DisplayName("markAsInTransit")
    class MarkAsInTransit {

        @Test
        @DisplayName("marks delivery as IN_TRANSIT")
        void marksInTransit() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "PICKED_UP");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsInTransit("track-1", "driver-1");

            assertThat(result.getStatus()).isEqualTo("IN_TRANSIT");
        }

        @Test
        @DisplayName("throws when wrong driver")
        void throwsWhenWrongDriver() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-correct", "PICKED_UP");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            assertThatThrownBy(() -> driverAcceptanceService.markAsInTransit("track-1", "driver-wrong"))
                .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("markAsArrived")
    class MarkAsArrived {

        @Test
        @DisplayName("marks delivery as ARRIVED and notifies customer")
        void marksArrived() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "IN_TRANSIT");
            tracking.setOrderId("order-1");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsArrived("track-1", "driver-1");

            assertThat(result.getStatus()).isEqualTo("ARRIVED");
            verify(messagingTemplate).convertAndSend(anyString(), (Object) any());
        }
    }

    @Nested
    @DisplayName("markAsDelivered")
    class MarkAsDelivered {

        @Test
        @DisplayName("marks delivery as DELIVERED and calculates actual delivery minutes")
        void marksDelivered() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "IN_TRANSIT");
            tracking.setOrderId("order-1");
            tracking.setPickedUpAt(LocalDateTime.now().minusMinutes(20));
            tracking.setEstimatedDeliveryMinutes(30);
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsDelivered("track-1", "driver-1", "Left at door");

            assertThat(result.getStatus()).isEqualTo("DELIVERED");
            assertThat(result.getDeliveredAt()).isNotNull();
            assertThat(result.getActualDeliveryMinutes()).isGreaterThanOrEqualTo(20);
            assertThat(result.getOnTime()).isTrue(); // 20 mins <= 30 mins estimated
        }

        @Test
        @DisplayName("returns existing tracking when already delivered (idempotent after OTP verify)")
        void idempotentWhenAlreadyDelivered() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "DELIVERED");
            LocalDateTime deliveredAt = LocalDateTime.now().minusMinutes(1);
            tracking.setDeliveredAt(deliveredAt);
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            DeliveryTracking result = driverAcceptanceService.markAsDelivered("track-1", "driver-1", null);

            assertThat(result.getStatus()).isEqualTo("DELIVERED");
            assertThat(result.getDeliveredAt()).isEqualTo(deliveredAt);
            verify(deliveryTrackingRepository, org.mockito.Mockito.never()).save(any());
        }

        @Test
        @DisplayName("throws when delivery is cancelled")
        void throwsWhenCancelled() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "CANCELLED");
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));

            assertThatThrownBy(() -> driverAcceptanceService.markAsDelivered("track-1", "driver-1", null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cancelled");
        }

        @Test
        @DisplayName("marks as late when actual time exceeds estimate")
        void marksAsLateWhenOverEstimate() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "IN_TRANSIT");
            tracking.setOrderId("order-1");
            tracking.setPickedUpAt(LocalDateTime.now().minusMinutes(45));
            tracking.setEstimatedDeliveryMinutes(30);
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsDelivered("track-1", "driver-1", null);

            assertThat(result.getOnTime()).isFalse(); // 45 mins > 30 mins estimated
        }

        @Test
        @DisplayName("handles null pickedUpAt gracefully (no actual delivery minutes calculated)")
        void handlesNullPickedUpAt() {
            DeliveryTracking tracking = buildTracking("track-1", "driver-1", "ASSIGNED");
            tracking.setOrderId("order-1");
            tracking.setPickedUpAt(null); // never picked up
            when(deliveryTrackingRepository.findById("track-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryTracking result = driverAcceptanceService.markAsDelivered("track-1", "driver-1", null);

            assertThat(result.getStatus()).isEqualTo("DELIVERED");
            assertThat(result.getActualDeliveryMinutes()).isNull();
        }
    }
}
