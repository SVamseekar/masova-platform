package com.MaSoVa.order.controller;

import com.MaSoVa.order.dto.CreateOrderRequest;
import com.MaSoVa.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.entity.Order.PaymentStatus;
import com.MaSoVa.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
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

    @GetMapping("/kitchen/{storeId}")
    public ResponseEntity<List<Order>> getKitchenQueue(@PathVariable String storeId) {
        List<Order> orders = orderService.getKitchenQueue(storeId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<Order>> getStoreOrders(@PathVariable String storeId) {
        List<Order> orders = orderService.getStoreOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable String customerId) {
        List<Order> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        Order order = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderId}/next-stage")
    public ResponseEntity<Order> moveToNextStage(@PathVariable String orderId) {
        Order order = orderService.moveOrderToNextStage(orderId);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/{orderId}")
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
            @RequestBody Map<String, String> payload) {
        PaymentStatus status = PaymentStatus.valueOf(payload.get("status"));
        String transactionId = payload.get("transactionId");
        Order order = orderService.updatePaymentStatus(orderId, status, transactionId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Order>> searchOrders(
            @RequestParam String storeId,
            @RequestParam String query) {
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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Error processing order request", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }
}
