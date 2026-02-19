package com.MaSoVa.logistics.delivery.controller;

import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationRequest;
import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationResponse;
import com.MaSoVa.logistics.delivery.dto.DriverAcceptanceRequest;
import com.MaSoVa.logistics.delivery.dto.DriverAcceptanceResponse;
import com.MaSoVa.logistics.delivery.dto.DriverRejectionRequest;
import com.MaSoVa.logistics.delivery.dto.ETAResponse;
import com.MaSoVa.logistics.delivery.dto.LocationUpdateRequest;
import com.MaSoVa.logistics.delivery.dto.TrackingResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.service.DriverAcceptanceService;
import com.MaSoVa.logistics.delivery.service.ETACalculationService;
import com.MaSoVa.logistics.delivery.service.LiveTrackingService;
import com.MaSoVa.logistics.delivery.service.ProofOfDeliveryService;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

/**
 * REST Controller for live tracking and location updates
 */
@RestController
@Tag(name = "Delivery Tracking", description = "APIs for real-time delivery tracking and updates")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/delivery")
public class TrackingController {

    private static final Logger log = LoggerFactory.getLogger(TrackingController.class);

    private final LiveTrackingService liveTrackingService;
    private final ETACalculationService etaCalculationService;
    private final ProofOfDeliveryService proofOfDeliveryService;
    private final DriverAcceptanceService driverAcceptanceService;

    public TrackingController(
            LiveTrackingService liveTrackingService,
            ETACalculationService etaCalculationService,
            ProofOfDeliveryService proofOfDeliveryService,
            DriverAcceptanceService driverAcceptanceService) {
        this.liveTrackingService = liveTrackingService;
        this.etaCalculationService = etaCalculationService;
        this.proofOfDeliveryService = proofOfDeliveryService;
        this.driverAcceptanceService = driverAcceptanceService;
    }

    /**
     * Extract storeId from HTTP headers
     */
    @SuppressWarnings("unused")
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        // Managers/Customers use selected store
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }

        // Staff/Driver use assigned store
        return userStoreId;
    }

    /**
     * Driver pushes location update
     * POST /api/delivery/location-update
     */
    @PostMapping("/location-update")
    public ResponseEntity<Map<String, Object>> updateLocation(@Valid @RequestBody LocationUpdateRequest request) {
        log.info("POST /api/delivery/location-update for driver: {}", request.getDriverId());

        try {
            liveTrackingService.updateDriverLocation(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Location updated successfully",
                "driverId", request.getDriverId(),
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Error updating location: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to update location: " + e.getMessage()
            ));
        }
    }

    /**
     * Customer tracks order delivery
     * GET /api/delivery/track/{orderId}
     */
    @GetMapping("/track/{orderId}")
    public ResponseEntity<TrackingResponse> trackOrder(@PathVariable String orderId) {
        log.info("GET /api/delivery/track/{}", orderId);

        try {
            TrackingResponse response = liveTrackingService.getOrderTracking(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error tracking order: {}", e.getMessage());
            throw new RuntimeException("Failed to get tracking info: " + e.getMessage());
        }
    }

    /**
     * Get ETA for an order
     * GET /api/delivery/eta/{orderId}
     */
    @GetMapping("/eta/{orderId}")
    public ResponseEntity<ETAResponse> getETA(@PathVariable String orderId) {
        log.info("GET /api/delivery/eta/{}", orderId);

        try {
            ETAResponse response = etaCalculationService.calculateETA(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating ETA: {}", e.getMessage());
            throw new RuntimeException("Failed to calculate ETA: " + e.getMessage());
        }
    }

    // ==================== PROOF OF DELIVERY ENDPOINTS (DELIV-002) ====================

    /**
     * Generate OTP for delivery verification
     * Called when order is dispatched
     * POST /api/delivery/{orderId}/generate-otp
     */
    @PostMapping("/{orderId}/generate-otp")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    public ResponseEntity<String> generateDeliveryOtp(@PathVariable String orderId) {
        log.info("POST /api/delivery/{}/generate-otp", orderId);

        try {
            String otp = proofOfDeliveryService.generateDeliveryOtp(orderId);
            return ResponseEntity.ok(otp);
        } catch (Exception e) {
            log.error("Error generating delivery OTP: {}", e.getMessage());
            throw new RuntimeException("Failed to generate OTP: " + e.getMessage());
        }
    }

    /**
     * Verify delivery using OTP
     * POST /api/delivery/verify-otp
     */
    @PostMapping("/verify-otp")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<DeliveryVerificationResponse> verifyDeliveryOtp(
            @Valid @RequestBody DeliveryVerificationRequest request) {
        log.info("POST /api/delivery/verify-otp for order: {}", request.getOrderId());

        try {
            DeliveryVerificationResponse response = proofOfDeliveryService.verifyDeliveryOtp(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying delivery OTP: {}", e.getMessage());
            throw new RuntimeException("Failed to verify OTP: " + e.getMessage());
        }
    }

    /**
     * Verify delivery with photo proof
     * POST /api/delivery/verify-photo
     */
    @PostMapping("/verify-photo")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<DeliveryVerificationResponse> verifyDeliveryWithPhoto(
            @Valid @RequestBody DeliveryVerificationRequest request) {
        log.info("POST /api/delivery/verify-photo for order: {}", request.getOrderId());

        try {
            DeliveryVerificationResponse response = proofOfDeliveryService.verifyDeliveryWithPhoto(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying delivery with photo: {}", e.getMessage());
            throw new RuntimeException("Failed to verify with photo: " + e.getMessage());
        }
    }

    /**
     * Verify delivery with signature
     * POST /api/delivery/verify-signature
     */
    @PostMapping("/verify-signature")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<DeliveryVerificationResponse> verifyDeliveryWithSignature(
            @Valid @RequestBody DeliveryVerificationRequest request) {
        log.info("POST /api/delivery/verify-signature for order: {}", request.getOrderId());

        try {
            DeliveryVerificationResponse response = proofOfDeliveryService.verifyDeliveryWithSignature(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying delivery with signature: {}", e.getMessage());
            throw new RuntimeException("Failed to verify with signature: " + e.getMessage());
        }
    }

    /**
     * Mark delivery as contactless (no verification required)
     * POST /api/delivery/contactless
     */
    @PostMapping("/contactless")
    @PreAuthorize("hasAnyRole('DRIVER')")
    public ResponseEntity<DeliveryVerificationResponse> markContactlessDelivery(
            @Valid @RequestBody DeliveryVerificationRequest request) {
        log.info("POST /api/delivery/contactless for order: {}", request.getOrderId());

        try {
            DeliveryVerificationResponse response = proofOfDeliveryService.markContactlessDelivery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking contactless delivery: {}", e.getMessage());
            throw new RuntimeException("Failed to mark contactless delivery: " + e.getMessage());
        }
    }

    /**
     * Regenerate OTP for delivery
     * POST /api/delivery/{orderId}/regenerate-otp
     */
    @PostMapping("/{orderId}/regenerate-otp")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER', 'CUSTOMER')")
    public ResponseEntity<String> regenerateOtp(@PathVariable String orderId) {
        log.info("POST /api/delivery/{}/regenerate-otp", orderId);

        try {
            String otp = proofOfDeliveryService.regenerateOtp(orderId);
            return ResponseEntity.ok(otp);
        } catch (Exception e) {
            log.error("Error regenerating OTP: {}", e.getMessage());
            throw new RuntimeException("Failed to regenerate OTP: " + e.getMessage());
        }
    }

    // ==================== DRIVER ACCEPTANCE FLOW ENDPOINTS (DELIV-003) ====================

    /**
     * Driver accepts delivery assignment
     * POST /api/delivery/accept
     */
    @PostMapping("/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverAcceptanceResponse> acceptDelivery(
            @Valid @RequestBody DriverAcceptanceRequest request) {
        log.info("POST /api/delivery/accept for tracking: {} by driver: {}",
                request.getTrackingId(), request.getDriverId());

        try {
            DriverAcceptanceResponse response = driverAcceptanceService.acceptDelivery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error accepting delivery: {}", e.getMessage());
            throw new RuntimeException("Failed to accept delivery: " + e.getMessage());
        }
    }

    /**
     * Driver rejects delivery assignment (triggers reassignment)
     * POST /api/delivery/reject
     */
    @PostMapping("/reject")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverAcceptanceResponse> rejectDelivery(
            @Valid @RequestBody DriverRejectionRequest request) {
        log.info("POST /api/delivery/reject for tracking: {} by driver: {}",
                request.getTrackingId(), request.getDriverId());

        try {
            DriverAcceptanceResponse response = driverAcceptanceService.rejectDelivery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error rejecting delivery: {}", e.getMessage());
            throw new RuntimeException("Failed to reject delivery: " + e.getMessage());
        }
    }

    /**
     * Get pending deliveries for a driver (assigned but not accepted)
     * GET /api/delivery/driver/{driverId}/pending
     */
    @GetMapping("/driver/{driverId}/pending")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<List<DeliveryTracking>> getPendingDeliveries(@PathVariable String driverId) {
        log.info("GET /api/delivery/driver/{}/pending", driverId);

        try {
            List<DeliveryTracking> pending = driverAcceptanceService.getPendingDeliveriesForDriver(driverId);
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            log.error("Error getting pending deliveries: {}", e.getMessage());
            throw new RuntimeException("Failed to get pending deliveries: " + e.getMessage());
        }
    }

    /**
     * Driver marks delivery as picked up
     * POST /api/delivery/{trackingId}/pickup
     */
    @PostMapping("/{trackingId}/pickup")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DeliveryTracking> markAsPickedUp(
            @PathVariable String trackingId,
            @RequestHeader("X-Driver-Id") String driverId) {
        log.info("POST /api/delivery/{}/pickup by driver: {}", trackingId, driverId);

        try {
            DeliveryTracking tracking = driverAcceptanceService.markAsPickedUp(trackingId, driverId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            log.error("Error marking as picked up: {}", e.getMessage());
            throw new RuntimeException("Failed to mark as picked up: " + e.getMessage());
        }
    }

    /**
     * Driver marks delivery as in transit
     * POST /api/delivery/{trackingId}/in-transit
     */
    @PostMapping("/{trackingId}/in-transit")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DeliveryTracking> markAsInTransit(
            @PathVariable String trackingId,
            @RequestHeader("X-Driver-Id") String driverId) {
        log.info("POST /api/delivery/{}/in-transit by driver: {}", trackingId, driverId);

        try {
            DeliveryTracking tracking = driverAcceptanceService.markAsInTransit(trackingId, driverId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            log.error("Error marking as in transit: {}", e.getMessage());
            throw new RuntimeException("Failed to mark as in transit: " + e.getMessage());
        }
    }

    /**
     * Driver marks as arrived at delivery location
     * POST /api/delivery/{trackingId}/arrived
     */
    @PostMapping("/{trackingId}/arrived")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DeliveryTracking> markAsArrived(
            @PathVariable String trackingId,
            @RequestHeader("X-Driver-Id") String driverId) {
        log.info("POST /api/delivery/{}/arrived by driver: {}", trackingId, driverId);

        try {
            DeliveryTracking tracking = driverAcceptanceService.markAsArrived(trackingId, driverId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            log.error("Error marking as arrived: {}", e.getMessage());
            throw new RuntimeException("Failed to mark as arrived: " + e.getMessage());
        }
    }

    /**
     * Driver marks delivery as delivered (simple/quick flow)
     * POST /api/delivery/{trackingId}/deliver
     *
     * This is a simpler flow without OTP/photo verification.
     * For more secure verification, use /verify-otp, /verify-photo,
     * /verify-signature, or /contactless endpoints.
     */
    @PostMapping("/{trackingId}/deliver")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DeliveryTracking> markAsDelivered(
            @PathVariable String trackingId,
            @RequestHeader(value = "X-Driver-Id", required = false) String headerDriverId,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            HttpServletRequest request) {

        // Get driver ID from header or request body
        String driverId = headerDriverId;
        String notes = null;

        if (body != null) {
            if (driverId == null && body.containsKey("driverId")) {
                driverId = (String) body.get("driverId");
            }
            if (body.containsKey("notes")) {
                notes = (String) body.get("notes");
            }
        }

        // Fall back to X-User-Id header if X-Driver-Id not provided
        if (driverId == null) {
            driverId = request.getHeader("X-User-Id");
        }

        if (driverId == null) {
            throw new RuntimeException("Driver ID is required");
        }

        log.info("POST /api/delivery/{}/deliver by driver: {}", trackingId, driverId);

        try {
            DeliveryTracking tracking = driverAcceptanceService.markAsDelivered(trackingId, driverId, notes);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            log.error("Error marking as delivered: {}", e.getMessage());
            throw new RuntimeException("Failed to mark as delivered: " + e.getMessage());
        }
    }
}
