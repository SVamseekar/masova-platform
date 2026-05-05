package com.MaSoVa.logistics.delivery.controller;

import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.*;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.service.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Delivery — 11 canonical endpoints at /api/delivery.
 * Merges: DispatchController + TrackingController + PerformanceController.
 * Replaces: /auto-dispatch, /route-optimize, /health, /drivers/available,
 *           /zone/check, /zone/fee, /zone/list, /zone/validate,
 *           /driver/status (PUT), /driver/{id}/status (GET),
 *           /location-update, /track/{orderId}, /eta/{orderId},
 *           /{orderId}/generate-otp, /verify-otp, /verify-photo,
 *           /verify-signature, /contactless, /{orderId}/regenerate-otp,
 *           /accept, /reject, /driver/{id}/pending,
 *           /{trackingId}/pickup, /{trackingId}/in-transit,
 *           /{trackingId}/arrived, /{trackingId}/deliver,
 *           /driver/{id}/performance, /driver/{id}/performance/today,
 *           /metrics/today
 */
@RestController
@RequestMapping("/api/delivery")
@Tag(name = "Delivery", description = "Dispatch, tracking, verification, and driver performance")
@SecurityRequirement(name = "bearerAuth")
public class DeliveryController {

    private static final Logger log = LoggerFactory.getLogger(DeliveryController.class);

    private final AutoDispatchService autoDispatchService;
    private final RouteOptimizationService routeOptimizationService;
    private final DeliveryZoneService deliveryZoneService;
    private final UserServiceClient userServiceClient;
    private final LiveTrackingService liveTrackingService;
    private final ETACalculationService etaCalculationService;
    private final ProofOfDeliveryService proofOfDeliveryService;
    private final DriverAcceptanceService driverAcceptanceService;
    private final PerformanceService performanceService;

    public DeliveryController(
            AutoDispatchService autoDispatchService,
            RouteOptimizationService routeOptimizationService,
            DeliveryZoneService deliveryZoneService,
            UserServiceClient userServiceClient,
            LiveTrackingService liveTrackingService,
            ETACalculationService etaCalculationService,
            ProofOfDeliveryService proofOfDeliveryService,
            DriverAcceptanceService driverAcceptanceService,
            PerformanceService performanceService) {
        this.autoDispatchService = autoDispatchService;
        this.routeOptimizationService = routeOptimizationService;
        this.deliveryZoneService = deliveryZoneService;
        this.userServiceClient = userServiceClient;
        this.liveTrackingService = liveTrackingService;
        this.etaCalculationService = etaCalculationService;
        this.proofOfDeliveryService = proofOfDeliveryService;
        this.driverAcceptanceService = driverAcceptanceService;
        this.performanceService = performanceService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    // ── DISPATCH ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/delivery/dispatch — auto-assign driver to an order
     * Replaces: POST /auto-dispatch
     */
    @PostMapping("/dispatch")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Auto-dispatch driver to order")
    public ResponseEntity<AutoDispatchResponse> dispatch(
            @Valid @RequestBody AutoDispatchRequest request,
            HttpServletRequest httpRequest) {
        String authorizedStoreId = getStoreIdFromHeaders(httpRequest);
        if (!authorizedStoreId.equals(request.getStoreId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(autoDispatchService.autoDispatch(request));
    }

    /**
     * POST /api/delivery/route — route optimisation
     * Replaces: POST /route-optimize
     */
    @PostMapping("/route")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Optimise delivery route")
    public ResponseEntity<RouteOptimizationResponse> optimiseRoute(
            @Valid @RequestBody RouteOptimizationRequest request) {
        return ResponseEntity.ok(routeOptimizationService.getOptimizedRoute(request));
    }

    // ── DRIVER ACCEPTANCE FLOW ────────────────────────────────────────────────────

    @PostMapping("/accept")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "Driver accepts delivery assignment")
    public ResponseEntity<DriverAcceptanceResponse> accept(
            @Valid @RequestBody DriverAcceptanceRequest request) {
        return ResponseEntity.ok(driverAcceptanceService.acceptDelivery(request));
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "Driver rejects delivery assignment (triggers reassignment)")
    public ResponseEntity<DriverAcceptanceResponse> reject(
            @Valid @RequestBody DriverRejectionRequest request) {
        return ResponseEntity.ok(driverAcceptanceService.rejectDelivery(request));
    }

    // ── LOCATION + TRACKING ───────────────────────────────────────────────────────

    /**
     * POST /api/delivery/location — driver pushes GPS update
     * Replaces: POST /location-update
     */
    @PostMapping("/location")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "Driver pushes location update")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @Valid @RequestBody LocationUpdateRequest request) {
        liveTrackingService.updateDriverLocation(request);
        return ResponseEntity.ok(Map.of("success", true, "driverId", request.getDriverId()));
    }

    /**
     * GET /api/delivery/track/{orderId} — customer tracks order (public, no auth)
     */
    @GetMapping("/track/{orderId}")
    @Operation(summary = "Track delivery by order ID (public, no auth)")
    public ResponseEntity<TrackingResponse> trackOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(liveTrackingService.getOrderTracking(orderId));
    }

    // ── VERIFICATION (OTP / PHOTO / SIGNATURE) ────────────────────────────────────

    /**
     * POST /api/delivery/verify — unified OTP + photo + signature + contactless verification
     * Body: { type: "otp"|"photo"|"signature"|"contactless", orderId, otp?, photoUrl?, ... }
     * Replaces: /verify-otp, /verify-photo, /verify-signature, /contactless
     */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "Verify delivery (body: type=otp|photo|signature|contactless)")
    public ResponseEntity<DeliveryVerificationResponse> verify(
            @Valid @RequestBody DeliveryVerificationRequest request) {
        String type = request.getProofType() != null ? request.getProofType() : "otp";
        return switch (type.toLowerCase()) {
            case "photo" -> ResponseEntity.ok(proofOfDeliveryService.verifyDeliveryWithPhoto(request));
            case "signature" -> ResponseEntity.ok(proofOfDeliveryService.verifyDeliveryWithSignature(request));
            case "contactless" -> ResponseEntity.ok(proofOfDeliveryService.markContactlessDelivery(request));
            default -> ResponseEntity.ok(proofOfDeliveryService.verifyDeliveryOtp(request));
        };
    }

    /**
     * POST /api/delivery/{orderId}/otp — generate (or regenerate) OTP for delivery
     * Replaces: /{orderId}/generate-otp and /{orderId}/regenerate-otp
     */
    @PostMapping("/{orderId}/otp")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER', 'CUSTOMER')")
    @Operation(summary = "Generate or regenerate delivery OTP")
    public ResponseEntity<String> generateOtp(@PathVariable String orderId) {
        return ResponseEntity.ok(proofOfDeliveryService.generateDeliveryOtp(orderId));
    }

    // ── DRIVER STATUS + PENDING DELIVERIES ────────────────────────────────────────

    /**
     * GET /api/delivery/driver/{driverId}/pending — deliveries assigned but not accepted
     */
    @GetMapping("/driver/{driverId}/pending")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get pending deliveries for driver")
    public ResponseEntity<List<DeliveryTracking>> getPendingDeliveries(@PathVariable String driverId) {
        return ResponseEntity.ok(driverAcceptanceService.getPendingDeliveriesForDriver(driverId));
    }

    /**
     * GET /api/delivery/driver/{driverId}/performance — driver performance metrics
     * Replaces: /driver/{id}/performance and /driver/{id}/performance/today
     */
    @GetMapping("/driver/{driverId}/performance")
    @Operation(summary = "Driver performance (query: startDate, endDate)")
    public ResponseEntity<DriverPerformanceResponse> getDriverPerformance(
            @PathVariable String driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        LocalDate from = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate to = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(performanceService.getDriverPerformance(driverId, storeId, from, to));
    }

    // ── ZONES + FEE ───────────────────────────────────────────────────────────────

    /**
     * GET /api/delivery/zones?storeId=&lat=&lng=&pincode=&check=true|fee=true
     * Replaces: /zone/check, /zone/fee, /zone/list, /zone/validate
     */
    @GetMapping("/zones")
    @Operation(summary = "Delivery zone info (query: storeId; optional: lat, lng, pincode, check, fee)")
    public ResponseEntity<?> getZones(
            @RequestParam String storeId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) Boolean check,
            @RequestParam(required = false) Boolean fee) {
        if (Boolean.TRUE.equals(fee) && lat != null && lng != null) {
            return ResponseEntity.ok(deliveryZoneService.calculateDeliveryFee(storeId, lat, lng));
        }
        if (Boolean.TRUE.equals(check) && lat != null && lng != null) {
            if (pincode != null) {
                return ResponseEntity.ok(deliveryZoneService.validateDeliveryAddress(storeId, lat, lng, pincode));
            }
            return ResponseEntity.ok(Map.of("isWithinDeliveryZone",
                    deliveryZoneService.isWithinDeliveryZone(storeId, lat, lng)));
        }
        return ResponseEntity.ok(deliveryZoneService.getDeliveryZones(storeId));
    }

    // ── TRACKING STATE TRANSITIONS (driver workflow) ───────────────────────────────

    /**
     * POST /api/delivery/{trackingId}/status — update tracking state
     * Body: { status: "PICKED_UP"|"IN_TRANSIT"|"ARRIVED"|"DELIVERED", driverId?, notes? }
     * Replaces: /{trackingId}/pickup, /{trackingId}/in-transit, /{trackingId}/arrived,
     *           /{trackingId}/deliver
     */
    @PostMapping("/{trackingId}/status")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "Update tracking status (body: status=PICKED_UP|IN_TRANSIT|ARRIVED|DELIVERED)")
    public ResponseEntity<DeliveryTracking> updateTrackingStatus(
            @PathVariable String trackingId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String driverId = (String) body.get("driverId");
        if (driverId == null) driverId = request.getHeader("X-Driver-Id");
        if (driverId == null) driverId = request.getHeader("X-User-Id");
        String notes = (String) body.get("notes");
        String status = (String) body.getOrDefault("status", "");
        return switch (status.toUpperCase()) {
            case "PICKED_UP" -> ResponseEntity.ok(driverAcceptanceService.markAsPickedUp(trackingId, driverId));
            case "IN_TRANSIT" -> ResponseEntity.ok(driverAcceptanceService.markAsInTransit(trackingId, driverId));
            case "ARRIVED" -> ResponseEntity.ok(driverAcceptanceService.markAsArrived(trackingId, driverId));
            case "DELIVERED" -> ResponseEntity.ok(driverAcceptanceService.markAsDelivered(trackingId, driverId, notes));
            default -> ResponseEntity.badRequest().build();
        };
    }

    // ── DRIVER STATUS (online / offline) ──────────────────────────────────────────

    /**
     * PATCH /api/delivery/driver/{driverId}/status — go online/offline
     * Body: { status: "AVAILABLE"|"OFF_DUTY" }
     * Replaces: PUT /driver/status + GET /driver/{id}/status
     */
    @PatchMapping("/driver/{driverId}/status")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update driver online/offline status")
    public ResponseEntity<Map<String, Object>> updateDriverStatus(
            @PathVariable String driverId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (!"AVAILABLE".equals(status) && !"OFF_DUTY".equals(status)) {
            return ResponseEntity.badRequest().body(Map.of("error", "status must be AVAILABLE or OFF_DUTY"));
        }
        if ("AVAILABLE".equals(status)) {
            try {
                Map<String, Object> session = userServiceClient.getEmployeeWorkingStatus(driverId);
                // Key is "active" (returned by UserServiceClient.getEmployeeWorkingStatus)
                Boolean isWorking = (Boolean) session.get("active");
                if (isWorking == null || !isWorking) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                            "error", "Must be clocked in by a manager before going online",
                            "requiresClockIn", true));
                }
            } catch (Exception e) {
                log.warn("Could not verify working session for driver {}: {}", driverId, e.getMessage());
            }
        }
        userServiceClient.updateDriverStatus(driverId, status);
        return ResponseEntity.ok(Map.of("driverId", driverId, "status", status));
    }

    @GetMapping("/driver/{driverId}/status")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get driver online/offline status")
    public ResponseEntity<Map<String, Object>> getDriverStatus(@PathVariable String driverId) {
        String status = userServiceClient.getDriverStatus(driverId);
        return ResponseEntity.ok(Map.of(
                "driverId", driverId,
                "status", status != null ? status : "OFF_DUTY",
                "isOnline", "AVAILABLE".equals(status)));
    }

    // ── STORE METRICS ─────────────────────────────────────────────────────────────

    /**
     * GET /api/delivery/metrics — today's delivery metrics for store
     * Replaces: /metrics/today (always today for now)
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Today's delivery metrics for store")
    public ResponseEntity<DeliveryMetricsResponse> getMetrics(HttpServletRequest request) {
        return ResponseEntity.ok(performanceService.getTodayMetrics(getStoreIdFromHeaders(request)));
    }

    // ── AVAILABLE DRIVERS ─────────────────────────────────────────────────────────

    @GetMapping("/drivers/available")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get available drivers for a store")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDrivers(@RequestParam String storeId) {
        return ResponseEntity.ok(userServiceClient.getAvailableDrivers(storeId));
    }

    // ── GDPR (internal-only, called by core-service GDPR service) ─────────────────

    /**
     * POST /api/delivery/gdpr/anonymize?customerId= — no-op for delivery tracking.
     * DeliveryTracking stores no customer PII (only orderId + driverId).
     * Internal-only: requires X-Internal-Service header.
     */
    @PostMapping("/gdpr/anonymize")
    @Operation(summary = "GDPR anonymise delivery data for customer (internal only — delivery tracking has no customer PII)")
    public ResponseEntity<Void> gdprAnonymize(
            @RequestParam String customerId,
            jakarta.servlet.http.HttpServletRequest request) {
        String internalCaller = request.getHeader("X-Internal-Service");
        if (internalCaller == null || internalCaller.isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        // DeliveryTracking stores no customer PII — nothing to anonymise
        log.info("GDPR anonymize delivery tracking for customerId={}: no PII stored, no-op", customerId);
        return ResponseEntity.ok().build();
    }
}
