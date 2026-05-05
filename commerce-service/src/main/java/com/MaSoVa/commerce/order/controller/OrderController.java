package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.commerce.order.dto.UpdatePaymentStatusRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.entity.QualityCheckpoint;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.shared.util.StoreContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Orders — 12 canonical endpoints at /api/orders.
 * Replaces: /api/v1/orders/**, /api/orders/status/{status}, /orders/store,
 *           /orders/customer/{id}, /orders/date/{date}, /orders/range,
 *           /orders/staff/{id}/date/{date}, /orders/search,
 *           /orders/store/failed-quality-checks, /orders/store/avg-prep-time,
 *           /orders/store/make-table/{station}, /orders/store/analytics/**,
 *           /orders/analytics/kitchen-staff/{id}/performance,
 *           /orders/analytics/pos-staff/{id}/performance,
 *           /orders/active-deliveries/count,
 *           /orders/{id}/assign-driver, /orders/{id}/priority,
 *           /orders/{id}/assign-make-table, /orders/{id}/next-stage,
 *           /orders/{id}/quality-checkpoint, /orders/{id}/quality-checkpoint/{name},
 *           /orders/{id}/quality-checkpoints,
 *           PUT /{id}/delivery-otp, PUT /{id}/delivery-proof, PUT /{id}/mark-delivered
 */
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Order lifecycle, kitchen queue, analytics")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public OrderController(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        return StoreContextUtil.getStoreIdFromHeaders(request);
    }

    private String validateAndGetStoreId(HttpServletRequest request, String requestedStoreId) {
        String userStoreId = getStoreIdFromHeaders(request);
        if (requestedStoreId == null || requestedStoreId.isEmpty()) {
            return userStoreId;
        }
        if (!requestedStoreId.equals(userStoreId)) {
            log.warn("Cross-store access attempt: user store={}, requested store={}", userStoreId, requestedStoreId);
            throw new AccessDeniedException("Cannot access data from different store");
        }
        return userStoreId;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Create order")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerName());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    // ── READ ──────────────────────────────────────────────────────────────────────

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    /**
     * GET /api/orders/track/{orderId} — public endpoint (no auth), for email tracking links
     */
    @GetMapping("/track/{orderId}")
    @Operation(summary = "Track order (public, no auth)")
    public ResponseEntity<Order> trackOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    /**
     * GET /api/orders?storeId=&customerId=&status=&date=&startDate=&endDate=&search=&kitchen=true
     * Replaces: /store, /customer/{id}, /status/{status}, /date/{date}, /range, /search, /kitchen,
     *           /number/{num}, /store/failed-quality-checks, /active-deliveries/count
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "List orders (query: storeId, customerId, status, date, startDate, endDate, search, kitchen, number)")
    public ResponseEntity<?> getOrders(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean kitchen,
            @RequestParam(required = false) String number,
            HttpServletRequest request) {

        String resolvedStoreId = validateAndGetStoreId(request, storeId);

        if (number != null) {
            return ResponseEntity.ok(orderService.getOrderByNumber(number));
        }
        if (Boolean.TRUE.equals(kitchen)) {
            return ResponseEntity.ok(orderService.getKitchenQueue(resolvedStoreId));
        }
        if (customerId != null) {
            return ResponseEntity.ok(orderService.getCustomerOrders(customerId));
        }
        if (search != null) {
            return ResponseEntity.ok(orderService.searchOrders(resolvedStoreId, search));
        }
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(orderService.getOrdersByDateRange(
                    resolvedStoreId, LocalDateTime.parse(startDate), LocalDateTime.parse(endDate)));
        }
        if (date != null) {
            return ResponseEntity.ok(orderService.getOrdersByDate(resolvedStoreId, LocalDate.parse(date)));
        }
        if (status != null) {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
            return ResponseEntity.ok(orderService.getOrdersByStatus(resolvedStoreId, orderStatus));
        }
        return ResponseEntity.ok(orderService.getStoreOrders(resolvedStoreId));
    }

    // ── STATE MACHINE: explicit status transition (for KDS, staff) ────────────────

    /**
     * POST /api/orders/{id}/status — canonical state-machine transition
     * Keeps as POST per CLAUDE.md spec; separate from PATCH (field updates).
     */
    @PostMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Transition order status (state machine)")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request));
    }

    /**
     * POST /api/orders/{id}/next-stage — KDS bump to next stage
     */
    @PostMapping("/{orderId}/next-stage")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Bump order to next kitchen stage (KDS)")
    public ResponseEntity<Order> nextStage(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.moveOrderToNextStage(orderId));
    }

    // ── PATCH: field updates (items, priority, driver, make-table, delivery proof/OTP) ──

    /**
     * PATCH /api/orders/{id}
     * Body can contain any of: items, priority, driverId,
     *   makeTableStation+staffId+staffName (make-table assignment),
     *   otp+generatedAt+expiresAt (delivery OTP),
     *   proofType+photoUrl+signatureUrl+notes (delivery proof),
     *   deliveredAt+proofType (mark delivered).
     * Replaces: /items, /priority, /assign-driver, /assign-make-table,
     *           PUT /{id}/delivery-otp, PUT /{id}/delivery-proof, PUT /{id}/mark-delivered
     */
    @PatchMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Update order fields (items, priority, driver, make-table, delivery proof/OTP)")
    public ResponseEntity<Order> updateOrder(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body) {

        // Make-table assignment
        if (body.containsKey("makeTableStation")) {
            return ResponseEntity.ok(orderService.assignToMakeTable(
                    orderId,
                    (String) body.get("makeTableStation"),
                    (String) body.get("staffId"),
                    (String) body.get("staffName")));
        }

        // Mark delivered
        if (body.containsKey("deliveredAt")) {
            return ResponseEntity.ok(orderService.markOrderDelivered(
                    orderId,
                    LocalDateTime.parse((String) body.get("deliveredAt")),
                    (String) body.get("proofType")));
        }

        // Delivery proof
        if (body.containsKey("photoUrl") || body.containsKey("signatureUrl")) {
            return ResponseEntity.ok(orderService.setDeliveryProof(
                    orderId,
                    (String) body.get("proofType"),
                    (String) body.get("photoUrl"),
                    (String) body.get("signatureUrl"),
                    (String) body.get("notes")));
        }

        // Delivery OTP
        if (body.containsKey("otp")) {
            return ResponseEntity.ok(orderService.setDeliveryOtp(
                    orderId,
                    (String) body.get("otp"),
                    LocalDateTime.parse((String) body.get("generatedAt")),
                    LocalDateTime.parse((String) body.get("expiresAt"))));
        }

        // Driver assignment
        if (body.containsKey("driverId")) {
            return ResponseEntity.ok(orderService.assignDriver(orderId, (String) body.get("driverId")));
        }

        // Priority update
        if (body.containsKey("priority")) {
            Order.Priority priority = Order.Priority.valueOf((String) body.get("priority"));
            return ResponseEntity.ok(orderService.updateOrderPriority(orderId, priority));
        }

        // Items update — body.get("items") is List<LinkedHashMap>, not List<OrderItem>
        if (body.containsKey("items")) {
            @SuppressWarnings("unchecked")
            List<Object> rawItems = (List<Object>) body.get("items");
            List<OrderItem> items = rawItems.stream()
                    .map(raw -> objectMapper.convertValue(raw, OrderItem.class))
                    .toList();
            return ResponseEntity.ok(orderService.updateOrderItems(orderId, items));
        }

        return ResponseEntity.badRequest().body(null);
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Cancel order")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String orderId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId, reason));
    }

    // ── PAYMENT STATUS (inter-service, called by payment-service) ─────────────────

    /**
     * PATCH /{orderId}/payment — update payment status.
     * Called by payment-service (inter-service via X-Internal-Service header)
     * or by MANAGER/STAFF for manual correction.
     */
    @PatchMapping("/{orderId}/payment")
    @Operation(summary = "Update payment status (inter-service or MANAGER/STAFF)")
    public ResponseEntity<Order> updatePaymentStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdatePaymentStatusRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String internalCaller = httpRequest.getHeader("X-Internal-Service");
        if (internalCaller == null || internalCaller.isBlank()) {
            // Not an internal call — require MANAGER/ASSISTANT_MANAGER/STAFF role
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            boolean hasRole = auth != null && auth.getAuthorities().stream().anyMatch(a ->
                    a.getAuthority().equals("ROLE_MANAGER") ||
                    a.getAuthority().equals("ROLE_ASSISTANT_MANAGER") ||
                    a.getAuthority().equals("ROLE_STAFF"));
            if (!hasRole) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(orderService.updatePaymentStatus(orderId, request.getStatus(), request.getTransactionId()));
    }

    // ── QUALITY CHECKPOINTS ───────────────────────────────────────────────────────

    @PostMapping("/{orderId}/quality-checkpoint")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Add quality checkpoint")
    public ResponseEntity<Order> addQualityCheckpoint(
            @PathVariable String orderId,
            @RequestBody QualityCheckpoint checkpoint) {
        return ResponseEntity.ok(orderService.addQualityCheckpoint(orderId, checkpoint));
    }

    @PatchMapping("/{orderId}/quality-checkpoint/{checkpointName}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Update quality checkpoint status")
    public ResponseEntity<Order> updateQualityCheckpoint(
            @PathVariable String orderId,
            @PathVariable String checkpointName,
            @RequestBody Map<String, String> payload) {
        QualityCheckpoint.CheckpointStatus status = QualityCheckpoint.CheckpointStatus.valueOf(payload.get("status"));
        return ResponseEntity.ok(orderService.updateQualityCheckpoint(orderId, checkpointName, status, payload.get("notes")));
    }

    // ── ANALYTICS (manager access) ────────────────────────────────────────────────

    /**
     * GET /api/orders/analytics?staffId=&date=&startDate=&endDate=&type=kitchen|pos|prep-time|prep-time-by-item|prep-time-distribution|failed-quality|active-deliveries|make-table-station
     * Replaces: /store/avg-prep-time, /store/analytics/prep-time-by-item,
     *           /store/analytics/prep-time-distribution, /store/failed-quality-checks,
     *           /active-deliveries/count, /store/make-table/{station},
     *           /analytics/kitchen-staff/{id}/performance, /analytics/pos-staff/{id}/performance
     */
    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Order analytics (query: type, staffId, date, startDate, endDate, station)")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String staffId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String station,
            HttpServletRequest request) {

        String storeId = getStoreIdFromHeaders(request);

        try {
            return switch (type != null ? type : "") {
                case "kitchen" -> {
                    if (staffId == null || date == null) yield ResponseEntity.badRequest().body(Map.of("error", "staffId and date required for kitchen analytics"));
                    yield ResponseEntity.ok(orderService.getKitchenStaffPerformance(staffId, LocalDate.parse(date)));
                }
                case "pos" -> {
                    if (staffId == null || startDate == null || endDate == null) yield ResponseEntity.badRequest().body(Map.of("error", "staffId, startDate and endDate required for pos analytics"));
                    yield ResponseEntity.ok(orderService.getPosStaffPerformance(staffId, LocalDate.parse(startDate), LocalDate.parse(endDate)));
                }
                case "prep-time" -> {
                    if (date == null) yield ResponseEntity.badRequest().body(Map.of("error", "date required for prep-time analytics"));
                    yield ResponseEntity.ok(orderService.getAveragePreparationTime(storeId, LocalDate.parse(date)));
                }
                case "prep-time-by-item" -> {
                    if (date == null) yield ResponseEntity.badRequest().body(Map.of("error", "date required for prep-time-by-item analytics"));
                    yield ResponseEntity.ok(orderService.getAveragePreparationTimeByMenuItem(storeId, LocalDate.parse(date)));
                }
                case "prep-time-distribution" -> {
                    if (date == null) yield ResponseEntity.badRequest().body(Map.of("error", "date required for prep-time-distribution analytics"));
                    yield ResponseEntity.ok(orderService.getPreparationTimeDistribution(storeId, LocalDate.parse(date)));
                }
                case "failed-quality" -> ResponseEntity.ok(orderService.getOrdersWithFailedQualityChecks(storeId));
                case "active-deliveries" -> ResponseEntity.ok(orderService.getActiveDeliveryCount(storeId));
                case "make-table-station" -> ResponseEntity.ok(orderService.getOrdersByMakeTableStation(storeId, station));
                default -> ResponseEntity.badRequest().body(Map.of("error", "type required: kitchen|pos|prep-time|prep-time-by-item|prep-time-distribution|failed-quality|active-deliveries|make-table-station"));
            };
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format. Use ISO-8601 (yyyy-MM-dd)"));
        }
    }

    // ── GDPR (internal-only, called by core-service user/GDPR service) ──────────

    /**
     * POST /api/orders/gdpr/anonymize?customerId= — anonymise all orders for a customer.
     * Internal-only: requires X-Internal-Service header. Not accessible via gateway.
     */
    @PostMapping("/gdpr/anonymize")
    @Operation(summary = "Anonymise order data for customer (GDPR erasure — internal only)")
    public ResponseEntity<Void> anonymizeCustomerOrders(
            @RequestParam String customerId,
            jakarta.servlet.http.HttpServletRequest request) {
        String internalCaller = request.getHeader("X-Internal-Service");
        if (internalCaller == null || internalCaller.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        orderService.anonymizeCustomerOrders(customerId);
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Error processing order request", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
