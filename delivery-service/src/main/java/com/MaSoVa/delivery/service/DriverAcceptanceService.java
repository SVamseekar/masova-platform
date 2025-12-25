package com.MaSoVa.delivery.service;

import com.MaSoVa.delivery.client.OrderServiceClient;
import com.MaSoVa.delivery.client.UserServiceClient;
import com.MaSoVa.delivery.dto.AddressDTO;
import com.MaSoVa.delivery.dto.AutoDispatchRequest;
import com.MaSoVa.delivery.dto.AutoDispatchResponse;
import com.MaSoVa.delivery.dto.DriverAcceptanceRequest;
import com.MaSoVa.delivery.dto.DriverAcceptanceResponse;
import com.MaSoVa.delivery.dto.DriverRejectionRequest;
import com.MaSoVa.delivery.entity.DeliveryTracking;
import com.MaSoVa.delivery.repository.DeliveryTrackingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for handling driver acceptance/rejection of delivery assignments.
 * DELIV-003: Driver Acceptance Flow
 *
 * Flow:
 * 1. Order dispatched → Driver assigned → Status: ASSIGNED
 * 2. Driver receives notification
 * 3a. Driver accepts → Status: ACCEPTED → Proceed to pickup
 * 3b. Driver rejects → Status: REJECTED → Trigger reassignment
 * 4. If no acceptance within timeout → Auto-reassign
 */
@Service
public class DriverAcceptanceService {

    private static final Logger log = LoggerFactory.getLogger(DriverAcceptanceService.class);

    // Default acceptance timeout (5 minutes)
    private static final int DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES = 5;

    // Maximum reassignment attempts before escalation
    private static final int MAX_REASSIGNMENT_ATTEMPTS = 3;

    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final UserServiceClient userServiceClient;
    @SuppressWarnings("unused")
    private final OrderServiceClient orderServiceClient;
    private final AutoDispatchService autoDispatchService;
    private final SimpMessagingTemplate messagingTemplate;

    public DriverAcceptanceService(
            DeliveryTrackingRepository deliveryTrackingRepository,
            UserServiceClient userServiceClient,
            OrderServiceClient orderServiceClient,
            AutoDispatchService autoDispatchService,
            SimpMessagingTemplate messagingTemplate) {
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.userServiceClient = userServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.autoDispatchService = autoDispatchService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Driver accepts the delivery assignment
     */
    public DriverAcceptanceResponse acceptDelivery(DriverAcceptanceRequest request) {
        log.info("Driver {} accepting delivery {}", request.getDriverId(), request.getTrackingId());

        DeliveryTracking tracking = deliveryTrackingRepository.findById(request.getTrackingId())
                .orElseThrow(() -> new RuntimeException("Delivery tracking not found: " + request.getTrackingId()));

        // Validate driver is the assigned driver
        if (!tracking.getDriverId().equals(request.getDriverId())) {
            throw new RuntimeException("Driver " + request.getDriverId() + " is not assigned to this delivery");
        }

        // Validate current status allows acceptance
        if (!"ASSIGNED".equals(tracking.getStatus())) {
            throw new RuntimeException("Delivery cannot be accepted. Current status: " + tracking.getStatus());
        }

        // Update tracking
        tracking.setStatus("ACCEPTED");
        tracking.setAcceptedAt(LocalDateTime.now());
        tracking.setUpdatedAt(LocalDateTime.now());

        // Set estimated times if provided
        if (request.getEstimatedPickupMinutes() != null) {
            tracking.setEstimatedDeliveryMinutes(
                    request.getEstimatedPickupMinutes() + 15  // Add estimated delivery time
            );
        }

        DeliveryTracking saved = deliveryTrackingRepository.save(tracking);

        // Notify customer via WebSocket
        notifyCustomerDriverAccepted(saved);

        // Notify store via WebSocket
        notifyStoreDriverAccepted(saved);

        log.info("Driver {} accepted delivery {} at {}", request.getDriverId(), request.getTrackingId(), saved.getAcceptedAt());

        return DriverAcceptanceResponse.builder()
                .trackingId(saved.getId())
                .orderId(saved.getOrderId())
                .status("ACCEPTED")
                .driverId(saved.getDriverId())
                .driverName(saved.getDriverName())
                .acceptedAt(saved.getAcceptedAt())
                .estimatedPickupMinutes(request.getEstimatedPickupMinutes())
                .estimatedDeliveryMinutes(saved.getEstimatedDeliveryMinutes())
                .message("Delivery accepted successfully. Proceed to pickup location.")
                .build();
    }

    /**
     * Driver rejects the delivery assignment
     * Triggers automatic reassignment to next best available driver
     */
    public DriverAcceptanceResponse rejectDelivery(DriverRejectionRequest request) {
        log.info("Driver {} rejecting delivery {}: {}", request.getDriverId(), request.getTrackingId(), request.getReason());

        DeliveryTracking tracking = deliveryTrackingRepository.findById(request.getTrackingId())
                .orElseThrow(() -> new RuntimeException("Delivery tracking not found: " + request.getTrackingId()));

        // Validate driver is the assigned driver
        if (!tracking.getDriverId().equals(request.getDriverId())) {
            throw new RuntimeException("Driver " + request.getDriverId() + " is not assigned to this delivery");
        }

        // Validate current status allows rejection
        if (!"ASSIGNED".equals(tracking.getStatus())) {
            throw new RuntimeException("Delivery cannot be rejected. Current status: " + tracking.getStatus());
        }

        // Update tracking with rejection
        tracking.setStatus("REJECTED");
        tracking.setRejectedAt(LocalDateTime.now());
        tracking.setRejectionReason(request.getReason() +
                (request.getAdditionalNotes() != null ? " - " + request.getAdditionalNotes() : ""));
        tracking.setUpdatedAt(LocalDateTime.now());

        // Increment reassignment count
        int reassignmentCount = tracking.getReassignmentCount() != null ? tracking.getReassignmentCount() + 1 : 1;
        tracking.setReassignmentCount(reassignmentCount);

        deliveryTrackingRepository.save(tracking);

        log.info("Driver {} rejected delivery {}. Reassignment count: {}",
                request.getDriverId(), request.getTrackingId(), reassignmentCount);

        // Check if max reassignments exceeded
        if (reassignmentCount >= MAX_REASSIGNMENT_ATTEMPTS) {
            log.warn("Max reassignment attempts ({}) reached for delivery {}. Escalating to manager.",
                    MAX_REASSIGNMENT_ATTEMPTS, request.getTrackingId());

            escalateToManager(tracking);

            return DriverAcceptanceResponse.builder()
                    .trackingId(tracking.getId())
                    .orderId(tracking.getOrderId())
                    .status("REJECTED")
                    .driverId(request.getDriverId())
                    .rejectedAt(tracking.getRejectedAt())
                    .rejectionReason(request.getReason())
                    .reassignmentTriggered(false)
                    .message("Delivery rejected. Max reassignment attempts reached. Escalated to manager.")
                    .build();
        }

        // Trigger automatic reassignment
        String newDriverId = triggerReassignment(tracking, request.getDriverId());

        return DriverAcceptanceResponse.builder()
                .trackingId(tracking.getId())
                .orderId(tracking.getOrderId())
                .status("REJECTED")
                .driverId(request.getDriverId())
                .rejectedAt(tracking.getRejectedAt())
                .rejectionReason(request.getReason())
                .reassignmentTriggered(newDriverId != null)
                .newDriverId(newDriverId)
                .message(newDriverId != null
                        ? "Delivery rejected and reassigned to driver: " + newDriverId
                        : "Delivery rejected. No available drivers for reassignment.")
                .build();
    }

    /**
     * Get pending deliveries for a driver (ASSIGNED but not yet accepted)
     */
    public List<DeliveryTracking> getPendingDeliveriesForDriver(String driverId) {
        return deliveryTrackingRepository.findByDriverIdAndStatus(driverId, "ASSIGNED");
    }

    /**
     * Check for expired acceptance windows and trigger reassignment
     * Called by scheduled job
     */
    public void processExpiredAcceptanceTimeouts() {
        log.debug("Checking for expired acceptance timeouts");

        List<DeliveryTracking> assignedDeliveries = deliveryTrackingRepository
                .findByStatusAndStoreId("ASSIGNED", null);  // Get all ASSIGNED deliveries

        LocalDateTime now = LocalDateTime.now();

        for (DeliveryTracking tracking : assignedDeliveries) {
            int timeout = tracking.getAcceptanceTimeoutMinutes() != null
                    ? tracking.getAcceptanceTimeoutMinutes()
                    : DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES;

            LocalDateTime expiryTime = tracking.getAssignedAt().plusMinutes(timeout);

            if (now.isAfter(expiryTime)) {
                log.info("Acceptance timeout expired for delivery {}. Triggering reassignment.", tracking.getId());

                // Create a synthetic rejection
                DriverRejectionRequest rejection = new DriverRejectionRequest(
                        tracking.getId(),
                        tracking.getDriverId(),
                        "ACCEPTANCE_TIMEOUT"
                );
                rejection.setAdditionalNotes("Automatic timeout after " + timeout + " minutes");

                try {
                    rejectDelivery(rejection);
                } catch (Exception e) {
                    log.error("Failed to process timeout for delivery {}: {}", tracking.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Trigger automatic reassignment to next best driver
     */
    private String triggerReassignment(DeliveryTracking tracking, String excludeDriverId) {
        log.info("Triggering reassignment for delivery {} (excluding driver {})",
                tracking.getId(), excludeDriverId);

        try {
            // Get available drivers excluding the one who rejected
            List<Map<String, Object>> availableDrivers = userServiceClient.getAvailableDrivers(tracking.getStoreId());

            // Filter out the driver who rejected
            availableDrivers.removeIf(driver -> excludeDriverId.equals(driver.get("id")));

            if (availableDrivers.isEmpty()) {
                log.warn("No available drivers for reassignment of delivery {}", tracking.getId());
                return null;
            }

            // Create auto-dispatch request
            AutoDispatchRequest dispatchRequest = new AutoDispatchRequest();
            dispatchRequest.setOrderId(tracking.getOrderId());
            dispatchRequest.setStoreId(tracking.getStoreId());

            if (tracking.getDeliveryAddress() != null) {
                AddressDTO deliveryAddress = AddressDTO.builder()
                        .street(tracking.getDeliveryAddress().getStreet())
                        .city(tracking.getDeliveryAddress().getCity())
                        .state(tracking.getDeliveryAddress().getState())
                        .zipCode(tracking.getDeliveryAddress().getZipCode())
                        .latitude(tracking.getDeliveryAddress().getLatitude())
                        .longitude(tracking.getDeliveryAddress().getLongitude())
                        .build();
                dispatchRequest.setDeliveryAddress(deliveryAddress);
            }

            // Use auto-dispatch to find next best driver
            AutoDispatchResponse response = autoDispatchService.autoDispatch(dispatchRequest);

            // Update original tracking record with reassignment info
            tracking.setUpdatedAt(LocalDateTime.now());
            deliveryTrackingRepository.save(tracking);

            // Notify new driver
            notifyDriverAssigned(response.getDriverId(), tracking);

            log.info("Delivery {} reassigned to driver {}", tracking.getId(), response.getDriverId());

            return response.getDriverId();

        } catch (Exception e) {
            log.error("Failed to reassign delivery {}: {}", tracking.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Escalate delivery to manager when max reassignments exceeded
     */
    private void escalateToManager(DeliveryTracking tracking) {
        log.warn("Escalating delivery {} to manager. Order: {}", tracking.getId(), tracking.getOrderId());

        // Update status to indicate escalation
        tracking.setStatus("ESCALATED");
        tracking.setUpdatedAt(LocalDateTime.now());
        deliveryTrackingRepository.save(tracking);

        // Notify store managers via WebSocket
        Map<String, Object> escalationNotification = Map.of(
                "type", "DELIVERY_ESCALATION",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "message", "Delivery requires manual assignment. All available drivers rejected.",
                "reassignmentCount", tracking.getReassignmentCount(),
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/store/" + tracking.getStoreId() + "/escalations",
                escalationNotification
        );
    }

    /**
     * Notify customer that driver accepted the delivery
     */
    @Async
    public void notifyCustomerDriverAccepted(DeliveryTracking tracking) {
        Map<String, Object> notification = Map.of(
                "type", "DRIVER_ACCEPTED",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "driverName", tracking.getDriverName() != null ? tracking.getDriverName() : "Driver",
                "driverPhone", tracking.getDriverPhone() != null ? tracking.getDriverPhone() : "",
                "message", "Your driver is on the way to pick up your order!",
                "estimatedDeliveryMinutes", tracking.getEstimatedDeliveryMinutes() != null ? tracking.getEstimatedDeliveryMinutes() : 30,
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/order/" + tracking.getOrderId() + "/tracking",
                notification
        );

        log.debug("Sent driver accepted notification for order {}", tracking.getOrderId());
    }

    /**
     * Notify store that driver accepted the delivery
     */
    @Async
    public void notifyStoreDriverAccepted(DeliveryTracking tracking) {
        Map<String, Object> notification = Map.of(
                "type", "DRIVER_ACCEPTED",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "driverId", tracking.getDriverId(),
                "driverName", tracking.getDriverName() != null ? tracking.getDriverName() : "Driver",
                "acceptedAt", tracking.getAcceptedAt().toString(),
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/store/" + tracking.getStoreId() + "/deliveries",
                notification
        );

        log.debug("Sent driver accepted notification to store {}", tracking.getStoreId());
    }

    /**
     * Notify driver of new assignment
     */
    @Async
    public void notifyDriverAssigned(String driverId, DeliveryTracking tracking) {
        Map<String, Object> notification = Map.of(
                "type", "NEW_DELIVERY_ASSIGNMENT",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "pickupAddress", tracking.getPickupAddress() != null ? tracking.getPickupAddress().getStreet() : "Store",
                "deliveryAddress", tracking.getDeliveryAddress() != null ? tracking.getDeliveryAddress().getStreet() : "",
                "estimatedDeliveryMinutes", tracking.getEstimatedDeliveryMinutes() != null ? tracking.getEstimatedDeliveryMinutes() : 30,
                "acceptanceTimeoutMinutes", DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES,
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/driver/" + driverId + "/assignments",
                notification
        );

        log.debug("Sent assignment notification to driver {}", driverId);
    }

    /**
     * Mark delivery as picked up (driver has collected the order)
     */
    public DeliveryTracking markAsPickedUp(String trackingId, String driverId) {
        DeliveryTracking tracking = deliveryTrackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Delivery tracking not found: " + trackingId));

        if (!tracking.getDriverId().equals(driverId)) {
            throw new RuntimeException("Driver " + driverId + " is not assigned to this delivery");
        }

        if (!"ACCEPTED".equals(tracking.getStatus())) {
            throw new RuntimeException("Delivery must be accepted before pickup. Current status: " + tracking.getStatus());
        }

        tracking.setStatus("PICKED_UP");
        tracking.setPickedUpAt(LocalDateTime.now());
        tracking.setUpdatedAt(LocalDateTime.now());

        DeliveryTracking saved = deliveryTrackingRepository.save(tracking);

        // Notify customer
        Map<String, Object> notification = Map.of(
                "type", "ORDER_PICKED_UP",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "driverName", tracking.getDriverName() != null ? tracking.getDriverName() : "Driver",
                "message", "Your order has been picked up and is on its way!",
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/order/" + tracking.getOrderId() + "/tracking",
                notification
        );

        log.info("Delivery {} marked as picked up by driver {}", trackingId, driverId);

        return saved;
    }

    /**
     * Update delivery status to IN_TRANSIT
     */
    public DeliveryTracking markAsInTransit(String trackingId, String driverId) {
        DeliveryTracking tracking = deliveryTrackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Delivery tracking not found: " + trackingId));

        if (!tracking.getDriverId().equals(driverId)) {
            throw new RuntimeException("Driver " + driverId + " is not assigned to this delivery");
        }

        tracking.setStatus("IN_TRANSIT");
        tracking.setUpdatedAt(LocalDateTime.now());

        return deliveryTrackingRepository.save(tracking);
    }

    /**
     * Mark driver as arrived at delivery location
     */
    public DeliveryTracking markAsArrived(String trackingId, String driverId) {
        DeliveryTracking tracking = deliveryTrackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Delivery tracking not found: " + trackingId));

        if (!tracking.getDriverId().equals(driverId)) {
            throw new RuntimeException("Driver " + driverId + " is not assigned to this delivery");
        }

        tracking.setStatus("ARRIVED");
        tracking.setUpdatedAt(LocalDateTime.now());

        DeliveryTracking saved = deliveryTrackingRepository.save(tracking);

        // Notify customer that driver has arrived
        Map<String, Object> notification = Map.of(
                "type", "DRIVER_ARRIVED",
                "trackingId", tracking.getId(),
                "orderId", tracking.getOrderId(),
                "driverName", tracking.getDriverName() != null ? tracking.getDriverName() : "Driver",
                "driverPhone", tracking.getDriverPhone() != null ? tracking.getDriverPhone() : "",
                "message", "Your driver has arrived! Please come to collect your order.",
                "timestamp", LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSend(
                "/topic/order/" + tracking.getOrderId() + "/tracking",
                notification
        );

        log.info("Driver {} arrived at delivery location for {}", driverId, trackingId);

        return saved;
    }
}
