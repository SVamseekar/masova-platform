package com.MaSoVa.order.controller;

import com.MaSoVa.order.dto.CreateOrderRequest;
import com.MaSoVa.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.order.dto.UpdatePaymentStatusRequest;
import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.service.OrderService;
import com.MaSoVa.shared.util.StoreContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
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

    // Only customers can create orders - staff/managers cannot place orders as customers
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER') or isAnonymous()")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerName());
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        Order order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<Order> getOrderByNumber(@PathVariable String orderNumber) {
        Order order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/kitchen")
    public ResponseEntity<List<Order>> getKitchenQueue(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        List<Order> orders = orderService.getKitchenQueue(storeId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/store")
    public ResponseEntity<List<Order>> getStoreOrders(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        List<Order> orders = orderService.getStoreOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    // Only customers can view their own orders
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable String customerId) {
        List<Order> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(orders);
    }

    // Only staff/managers can update order status
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String orderId,
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

    @PatchMapping("/{orderId}/assign-driver")
    public ResponseEntity<Order> assignDriver(
            @PathVariable String orderId,
            @RequestBody Map<String, String> payload) {
        String driverId = payload.get("driverId");
        Order order = orderService.assignDriver(orderId, driverId);
        return ResponseEntity.ok(order);
    }

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

    // Analytics endpoints
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Order>> getOrdersByDate(@PathVariable String date) {
        log.info("Fetching orders for date: {}", date);
        List<Order> orders = orderService.getOrdersByDate(java.time.LocalDate.parse(date));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/range")
    public ResponseEntity<List<Order>> getOrdersByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        log.info("Fetching orders between {} and {}", start, end);
        List<Order> orders = orderService.getOrdersByDateRange(
            java.time.LocalDateTime.parse(start),
            java.time.LocalDateTime.parse(end)
        );
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/staff/{staffId}/date/{date}")
    public ResponseEntity<List<Order>> getOrdersByStaffAndDate(
            @PathVariable String staffId,
            @PathVariable String date) {
        log.info("Fetching orders for staff: {} on date: {}", staffId, date);
        List<Order> orders = orderService.getOrdersByStaffAndDate(staffId, java.time.LocalDate.parse(date));
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/active-deliveries/count")
    public ResponseEntity<Integer> getActiveDeliveryCount() {
        log.info("Fetching active delivery count");
        Integer count = orderService.getActiveDeliveryCount();
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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Error processing order request", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }
}
