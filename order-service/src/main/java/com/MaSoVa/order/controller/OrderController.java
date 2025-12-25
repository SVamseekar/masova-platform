package com.MaSoVa.order.controller;

import com.MaSoVa.order.dto.CreateOrderRequest;
import com.MaSoVa.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.order.dto.UpdatePaymentStatusRequest;
import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.service.OrderService;
import com.MaSoVa.shared.config.ApiVersionConfig;
import com.MaSoVa.shared.util.StoreContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Order Controller - Week 4: API Versioning Applied, Week 5: Swagger Documentation
 */
@RestController
@RequestMapping({ApiVersionConfig.V1 + "/orders", ApiVersionConfig.LEGACY + "/orders"})
@Tag(name = "Order Management", description = "APIs for managing orders, kitchen workflow, and order lifecycle")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Extract storeId from request headers based on user type
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        return StoreContextUtil.getStoreIdFromHeaders(request);
    }

    /**
     * Validate that the requested storeId matches the user's authorized store.
     * For store data isolation - prevents cross-store access.
     */
    private String validateAndGetStoreId(HttpServletRequest request, String requestedStoreId) {
        String userStoreId = getStoreIdFromHeaders(request);

        // If no storeId provided in query param, use user's store
        if (requestedStoreId == null || requestedStoreId.isEmpty()) {
            return userStoreId;
        }

        // If storeId provided but different from user's store, reject
        if (!requestedStoreId.equals(userStoreId)) {
            log.warn("Cross-store access attempt: user store={}, requested store={}", userStoreId, requestedStoreId);
            throw new AccessDeniedException("Cannot access data from different store");
        }

        return userStoreId;
    }

    // Customers can create their own orders, staff/managers can create orders for walk-in customers (POS)
    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Create new order", description = "Allows customers to create orders or staff/managers to create orders for walk-in customers via POS")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Order created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Customer or Staff role required")
    })
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerName());
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    // Customers, staff, managers, and drivers can view orders
    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Get order by ID", description = "Retrieves order details by order ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Order not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Order> getOrder(
            @Parameter(description = "Order ID", required = true) @PathVariable String orderId) {
        Order order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    public ResponseEntity<Order> getOrderByNumber(@PathVariable String orderNumber) {
        Order order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(order);
    }

    // Only staff and managers can view kitchen queue (for Kitchen Display System)
    @GetMapping("/kitchen")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get kitchen queue", description = "Retrieves all active orders in kitchen queue for Kitchen Display System")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Kitchen queue retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Staff role required"),
        @ApiResponse(responseCode = "403", description = "Access denied - Cross-store access attempt")
    })
    public ResponseEntity<List<Order>> getKitchenQueue(
            HttpServletRequest request,
            @Parameter(description = "Store ID (optional, defaults to user's store)") @RequestParam(required = false) String storeId) {
        // Validate store access - prevents cross-store data access
        String resolvedStoreId = validateAndGetStoreId(request, storeId);
        List<Order> orders = orderService.getKitchenQueue(resolvedStoreId);
        return ResponseEntity.ok(orders);
    }

    // Staff and managers can view store orders
    @GetMapping("/store")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<List<Order>> getStoreOrders(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        List<Order> orders = orderService.getStoreOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    // Staff, managers, and drivers can view orders by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    public ResponseEntity<List<Order>> getOrdersByStatus(
            HttpServletRequest request,
            @PathVariable String status) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching orders with status: {} for store: {}", status, storeId);

        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
            List<Order> orders = orderService.getOrdersByStatus(storeId, orderStatus);
            return ResponseEntity.ok(orders);
        } catch (IllegalArgumentException e) {
            log.error("Invalid order status: {}", status);
            return ResponseEntity.badRequest().body(List.of());
        }
    }

    // Only customers can view their own orders
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable String customerId) {
        List<Order> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(orders);
    }

    // Staff, managers, and drivers can update order status
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
    @Operation(summary = "Update order status", description = "Updates the status of an order (e.g., preparing, ready, completed)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order status updated successfully"),
        @ApiResponse(responseCode = "404", description = "Order not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Staff role required")
    })
    public ResponseEntity<Order> updateOrderStatus(
            @Parameter(description = "Order ID", required = true) @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        Order order = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(order);
    }

    // Only staff/managers can move orders to next stage
    @PatchMapping("/{orderId}/next-stage")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<Order> moveToNextStage(@PathVariable String orderId) {
        Order order = orderService.moveOrderToNextStage(orderId);
        return ResponseEntity.ok(order);
    }

    // Customers can cancel their own orders, staff can cancel any order
    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String orderId,
            @RequestParam(required = false) String reason) {
        Order order = orderService.cancelOrder(orderId, reason);
        return ResponseEntity.ok(order);
    }

    // Only managers and assistant managers can assign drivers
    @PatchMapping("/{orderId}/assign-driver")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<Order> assignDriver(
            @PathVariable String orderId,
            @RequestBody Map<String, String> payload) {
        String driverId = payload.get("driverId");
        Order order = orderService.assignDriver(orderId, driverId);
        return ResponseEntity.ok(order);
    }

    // Called by payment-service after payment verification (public endpoint for inter-service communication)
    @PatchMapping("/{orderId}/payment")
    public ResponseEntity<Order> updatePaymentStatus(
            @PathVariable String orderId,
            @RequestBody @Valid UpdatePaymentStatusRequest request) {
        log.info("Updating payment status for order: {} to status: {}", orderId, request.getStatus());
        Order order = orderService.updatePaymentStatus(orderId, request.getStatus(), request.getTransactionId());
        log.info("Payment status updated successfully for order: {}", orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Order>> searchOrders(
            HttpServletRequest request,
            @RequestParam String query) {
        String storeId = getStoreIdFromHeaders(request);
        List<Order> orders = orderService.searchOrders(storeId, query);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/{orderId}/items")
    public ResponseEntity<Order> updateOrderItems(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<com.MaSoVa.order.entity.OrderItem> items =
            (List<com.MaSoVa.order.entity.OrderItem>) payload.get("items");
        Order order = orderService.updateOrderItems(orderId, items);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderId}/priority")
    public ResponseEntity<Order> updateOrderPriority(
            @PathVariable String orderId,
            @RequestBody Map<String, String> payload) {
        Order.Priority priority = Order.Priority.valueOf(payload.get("priority"));
        Order order = orderService.updateOrderPriority(orderId, priority);
        return ResponseEntity.ok(order);
    }

    // Analytics endpoints - Used by analytics service for reporting
    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get orders by date", description = "Retrieves all orders for a specific date (used by analytics service)")
    public ResponseEntity<List<Order>> getOrdersByDate(@PathVariable String date, HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        log.info("Fetching orders for store {} on date: {}", storeId, date);
        List<Order> orders = orderService.getOrdersByDate(storeId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/range")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get orders by date range", description = "Retrieves orders within a date range (used by analytics service)")
    public ResponseEntity<List<Order>> getOrdersByDateRange(
            @RequestParam String start,
            @RequestParam String end,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        log.info("Fetching orders for store {} between {} and {}", storeId, start, end);
        List<Order> orders = orderService.getOrdersByDateRange(
            storeId,
            java.time.LocalDateTime.parse(start),
            java.time.LocalDateTime.parse(end)
        );
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/staff/{staffId}/date/{date}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get orders by staff and date", description = "Retrieves orders created by specific staff member on a date (used by analytics service)")
    public ResponseEntity<List<Order>> getOrdersByStaffAndDate(
            @PathVariable String staffId,
            @PathVariable String date,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        log.info("Fetching orders for store {} staff: {} on date: {}", storeId, staffId, date);
        List<Order> orders = orderService.getOrdersByStaffAndDate(storeId, staffId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/active-deliveries/count")
    public ResponseEntity<Integer> getActiveDeliveryCount(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        log.info("Fetching active delivery count for store {}", storeId);
        Integer count = orderService.getActiveDeliveryCount(storeId);
        return ResponseEntity.ok(count);
    }

    // Quality Checkpoint endpoints
    @PostMapping("/{orderId}/quality-checkpoint")
    public ResponseEntity<Order> addQualityCheckpoint(
            @PathVariable String orderId,
            @RequestBody com.MaSoVa.order.entity.QualityCheckpoint checkpoint) {
        log.info("Adding quality checkpoint to order: {}", orderId);
        Order order = orderService.addQualityCheckpoint(orderId, checkpoint);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderId}/quality-checkpoint/{checkpointName}")
    public ResponseEntity<Order> updateQualityCheckpoint(
            @PathVariable String orderId,
            @PathVariable String checkpointName,
            @RequestBody Map<String, String> payload) {
        log.info("Updating quality checkpoint {} for order: {}", checkpointName, orderId);

        com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus status =
                com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.valueOf(payload.get("status"));
        String notes = payload.get("notes");

        Order order = orderService.updateQualityCheckpoint(orderId, checkpointName, status, notes);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderId}/quality-checkpoints")
    public ResponseEntity<List<com.MaSoVa.order.entity.QualityCheckpoint>> getQualityCheckpoints(
            @PathVariable String orderId) {
        log.info("Fetching quality checkpoints for order: {}", orderId);
        List<com.MaSoVa.order.entity.QualityCheckpoint> checkpoints = orderService.getQualityCheckpoints(orderId);
        return ResponseEntity.ok(checkpoints);
    }

    @GetMapping("/store/failed-quality-checks")
    public ResponseEntity<List<Order>> getOrdersWithFailedQualityChecks(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching orders with failed quality checks for store: {}", storeId);
        List<Order> orders = orderService.getOrdersWithFailedQualityChecks(storeId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/store/avg-prep-time")
    public ResponseEntity<Double> getAveragePreparationTime(
            HttpServletRequest request,
            @RequestParam String date) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching average preparation time for store: {} on date: {}", storeId, date);
        Double avgPrepTime = orderService.getAveragePreparationTime(storeId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(avgPrepTime);
    }

    // Make-table workflow endpoints
    @PatchMapping("/{orderId}/assign-make-table")
    public ResponseEntity<Order> assignToMakeTable(
            @PathVariable String orderId,
            @RequestBody Map<String, String> payload) {
        log.info("Assigning order {} to make-table", orderId);
        String station = payload.get("station");
        String staffId = payload.get("staffId");
        String staffName = payload.get("staffName");
        Order order = orderService.assignToMakeTable(orderId, station, staffId, staffName);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/store/make-table/{station}")
    public ResponseEntity<List<Order>> getOrdersByMakeTableStation(
            HttpServletRequest request,
            @PathVariable String station) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching orders for make-table station: {} in store: {}", station, storeId);
        List<Order> orders = orderService.getOrdersByMakeTableStation(storeId, station);
        return ResponseEntity.ok(orders);
    }

    // Kitchen analytics endpoints
    @GetMapping("/store/analytics/prep-time-by-item")
    public ResponseEntity<Map<String, Double>> getAveragePreparationTimeByItem(
            HttpServletRequest request,
            @RequestParam String date) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching average prep time by menu item for store: {} on date: {}", storeId, date);
        Map<String, Double> prepTimes = orderService.getAveragePreparationTimeByMenuItem(
                storeId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(prepTimes);
    }

    @GetMapping("/analytics/kitchen-staff/{staffId}/performance")
    public ResponseEntity<Map<String, Object>> getKitchenStaffPerformance(
            @PathVariable String staffId,
            @RequestParam String date) {
        log.info("Fetching kitchen staff performance for: {} on date: {}", staffId, date);
        Map<String, Object> performance = orderService.getKitchenStaffPerformance(
                staffId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/analytics/pos-staff/{staffId}/performance")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get POS staff performance", description = "Retrieves performance metrics for POS staff including orders processed and revenue generated")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Performance metrics retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<com.MaSoVa.order.dto.PosStaffPerformanceDTO> getPosStaffPerformance(
            @Parameter(description = "Staff ID", required = true) @PathVariable String staffId,
            @Parameter(description = "Start date (YYYY-MM-DD)", required = true) @RequestParam String startDate,
            @Parameter(description = "End date (YYYY-MM-DD)", required = true) @RequestParam String endDate) {
        log.info("Fetching POS staff performance for: {} from {} to {}", staffId, startDate, endDate);
        com.MaSoVa.order.dto.PosStaffPerformanceDTO performance = orderService.getPosStaffPerformance(
                staffId,
                java.time.LocalDate.parse(startDate),
                java.time.LocalDate.parse(endDate));
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/store/analytics/prep-time-distribution")
    public ResponseEntity<Map<String, Object>> getPreparationTimeDistribution(
            HttpServletRequest request,
            @RequestParam String date) {
        String storeId = getStoreIdFromHeaders(request);
        log.info("Fetching prep time distribution for store: {} on date: {}", storeId, date);
        Map<String, Object> distribution = orderService.getPreparationTimeDistribution(
                storeId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(distribution);
    }

    // ==================== PROOF OF DELIVERY ENDPOINTS (DELIV-002) ====================

    /**
     * Set delivery OTP for an order
     * Called by delivery-service when generating OTP
     */
    @PutMapping("/{orderId}/delivery-otp")
    public ResponseEntity<Order> setDeliveryOtp(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> payload) {
        log.info("Setting delivery OTP for order: {}", orderId);

        String otp = (String) payload.get("otp");
        String generatedAt = (String) payload.get("generatedAt");
        String expiresAt = (String) payload.get("expiresAt");

        Order order = orderService.setDeliveryOtp(
                orderId,
                otp,
                java.time.LocalDateTime.parse(generatedAt),
                java.time.LocalDateTime.parse(expiresAt)
        );
        return ResponseEntity.ok(order);
    }

    /**
     * Set delivery proof details
     * Called by delivery-service when verifying delivery
     */
    @PutMapping("/{orderId}/delivery-proof")
    public ResponseEntity<Order> setDeliveryProof(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> payload) {
        log.info("Setting delivery proof for order: {}", orderId);

        String proofType = (String) payload.get("proofType");
        String photoUrl = (String) payload.get("photoUrl");
        String signatureUrl = (String) payload.get("signatureUrl");
        String notes = (String) payload.get("notes");

        Order order = orderService.setDeliveryProof(orderId, proofType, photoUrl, signatureUrl, notes);
        return ResponseEntity.ok(order);
    }

    /**
     * Mark order as delivered
     * Called by delivery-service after verification
     */
    @PutMapping("/{orderId}/mark-delivered")
    public ResponseEntity<Order> markOrderDelivered(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> payload) {
        log.info("Marking order as delivered: {}", orderId);

        String deliveredAtStr = (String) payload.get("deliveredAt");
        String proofType = (String) payload.get("proofType");

        java.time.LocalDateTime deliveredAt = java.time.LocalDateTime.parse(deliveredAtStr);
        Order order = orderService.markOrderDelivered(orderId, deliveredAt, proofType);
        return ResponseEntity.ok(order);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Error processing order request", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }
}
