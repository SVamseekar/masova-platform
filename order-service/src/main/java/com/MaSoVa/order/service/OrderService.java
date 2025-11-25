package com.MaSoVa.order.service;

import com.MaSoVa.order.dto.CreateOrderRequest;
import com.MaSoVa.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.entity.Order.OrderStatus;
import com.MaSoVa.order.entity.Order.Priority;
import com.MaSoVa.order.entity.OrderItem;
import com.MaSoVa.order.repository.OrderRepository;
import com.MaSoVa.order.websocket.OrderWebSocketController;
import com.MaSoVa.order.client.MenuServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderWebSocketController webSocketController;
    private final MenuServiceClient menuServiceClient;
    private final Random random = new Random();

    public OrderService(OrderRepository orderRepository, OrderWebSocketController webSocketController, MenuServiceClient menuServiceClient) {
        this.orderRepository = orderRepository;
        this.webSocketController = webSocketController;
        this.menuServiceClient = menuServiceClient;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerName());

        // Validate stock availability and pricing
        validateOrderItems(request.getItems());

        // Convert request items to order items
        List<OrderItem> orderItems = request.getItems().stream()
                .map(item -> OrderItem.builder()
                        .menuItemId(item.getMenuItemId())
                        .name(item.getName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .variant(item.getVariant())
                        .customizations(item.getCustomizations())
                        .build())
                .collect(Collectors.toList());

        // Calculate totals
        double subtotal = orderItems.stream()
                .mapToDouble(OrderItem::getItemTotal)
                .sum();

        double deliveryFee = Order.OrderType.DELIVERY.equals(request.getOrderType()) ? 50.0 : 0.0;
        double tax = subtotal * 0.05; // 5% GST
        double total = subtotal + deliveryFee + tax;

        // Generate unique order number
        String orderNumber = generateOrderNumber();

        // Build order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .storeId(request.getStoreId())
                .items(orderItems)
                .subtotal(subtotal)
                .deliveryFee(deliveryFee)
                .tax(tax)
                .total(total)
                .status(OrderStatus.RECEIVED)
                .orderType(request.getOrderType())
                .paymentStatus(Order.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .priority(Priority.NORMAL)
                .deliveryAddress(request.getDeliveryAddress())
                .specialInstructions(request.getSpecialInstructions())
                .preparationTime(calculatePreparationTime(orderItems.size()))
                .receivedAt(LocalDateTime.now())
                .build();

        // Calculate estimated delivery time
        if (Order.OrderType.DELIVERY.equals(request.getOrderType())) {
            order.setEstimatedDeliveryTime(
                    LocalDateTime.now().plusMinutes(order.getPreparationTime() + 30)
            );
        }

        // Initialize quality checkpoints for the order
        initializeQualityCheckpoints(order);

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {}", savedOrder.getOrderNumber());

        // Broadcast new order via WebSocket
        webSocketController.sendKitchenQueueUpdate(savedOrder.getStoreId(), savedOrder);
        if (savedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(savedOrder.getCustomerId(), savedOrder);
        }

        return savedOrder;
    }

    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
    }

    public Order getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));
    }

    public List<Order> getKitchenQueue(String storeId) {
        // Kitchen queue shows orders in RECEIVED, PREPARING, OVEN, BAKED stages
        List<OrderStatus> kitchenStatuses = List.of(
                OrderStatus.RECEIVED,
                OrderStatus.PREPARING,
                OrderStatus.OVEN,
                OrderStatus.BAKED
        );

        List<Order> orders = orderRepository.findByStoreIdAndStatusIn(storeId, kitchenStatuses);

        // Priority-based sorting: URGENT first, then by creation time
        return orders.stream()
                .sorted(Comparator
                        .comparing(Order::getPriority, Comparator.reverseOrder())
                        .thenComparing(Order::getCreatedAt))
                .collect(Collectors.toList());
    }

    public List<Order> getStoreOrders(String storeId) {
        return orderRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
    }

    public List<Order> getCustomerOrders(String customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public Order updateOrderStatus(String orderId, UpdateOrderStatusRequest request) {
        Order order = getOrderById(orderId);
        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        log.info("Updating order {} status from {} to {}",
                order.getOrderNumber(), currentStatus, newStatus);

        // Validate status transition
        validateStatusTransition(currentStatus, newStatus);

        // Update status and timestamps
        order.setStatus(newStatus);
        updateStatusTimestamps(order, newStatus);

        // Calculate preparation times when order reaches BAKED or later stages
        if (newStatus == OrderStatus.BAKED || newStatus == OrderStatus.DISPATCHED || newStatus == OrderStatus.DELIVERED) {
            calculateAndUpdatePreparationTimes(order);
        }

        Order updatedOrder = orderRepository.save(order);
        log.info("Order status updated successfully: {}", updatedOrder.getOrderNumber());

        // Broadcast status update via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
        webSocketController.sendOrderUpdateToStore(updatedOrder.getStoreId(), updatedOrder);
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        return updatedOrder;
    }

    @Transactional
    public Order moveOrderToNextStage(String orderId) {
        Order order = getOrderById(orderId);
        OrderStatus currentStatus = order.getStatus();
        OrderStatus nextStatus = getNextStatus(currentStatus);

        if (nextStatus == null) {
            throw new RuntimeException("Order is already in final stage");
        }

        log.info("Moving order {} from {} to {}",
                order.getOrderNumber(), currentStatus, nextStatus);

        order.setStatus(nextStatus);
        updateStatusTimestamps(order, nextStatus);

        // Calculate preparation times when order reaches BAKED or later stages
        if (nextStatus == OrderStatus.BAKED || nextStatus == OrderStatus.DISPATCHED || nextStatus == OrderStatus.DELIVERED) {
            calculateAndUpdatePreparationTimes(order);
        }

        if (nextStatus == OrderStatus.DELIVERED) {
            order.setCompletedAt(LocalDateTime.now());
        }

        Order updatedOrder = orderRepository.save(order);

        // Broadcast status update via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
        webSocketController.sendOrderUpdateToStore(updatedOrder.getStoreId(), updatedOrder);
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        return updatedOrder;
    }

    @Transactional
    public Order cancelOrder(String orderId, String reason) {
        Order order = getOrderById(orderId);

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel delivered order");
        }

        log.info("Cancelling order: {}", order.getOrderNumber());

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(reason);

        Order cancelledOrder = orderRepository.save(order);

        // Broadcast cancellation via WebSocket
        webSocketController.sendKitchenQueueUpdate(cancelledOrder.getStoreId(), cancelledOrder);
        webSocketController.sendOrderUpdateToStore(cancelledOrder.getStoreId(), cancelledOrder);
        if (cancelledOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(cancelledOrder.getCustomerId(), cancelledOrder);
        }

        return cancelledOrder;
    }

    @Transactional
    public Order assignDriver(String orderId, String driverId) {
        Order order = getOrderById(orderId);

        if (order.getOrderType() != Order.OrderType.DELIVERY) {
            throw new RuntimeException("Cannot assign driver to non-delivery order");
        }

        order.setAssignedDriverId(driverId);
        return orderRepository.save(order);
    }

    @Transactional
    public Order updatePaymentStatus(String orderId, Order.PaymentStatus paymentStatus, String transactionId) {
        Order order = getOrderById(orderId);
        order.setPaymentStatus(paymentStatus);
        order.setPaymentTransactionId(transactionId);

        Order updatedOrder = orderRepository.save(order);

        // Broadcast payment update via WebSocket
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        return updatedOrder;
    }

    @Transactional
    public Order updateOrderItems(String orderId, List<OrderItem> newItems) {
        Order order = getOrderById(orderId);

        // Only allow modifications before kitchen starts preparation
        if (order.getStatus() != OrderStatus.RECEIVED) {
            throw new RuntimeException("Cannot modify order after preparation has started");
        }

        log.info("Updating items for order: {}", order.getOrderNumber());

        // Update items
        order.setItems(newItems);

        // Recalculate totals
        double subtotal = newItems.stream()
                .mapToDouble(OrderItem::getItemTotal)
                .sum();

        double deliveryFee = Order.OrderType.DELIVERY.equals(order.getOrderType()) ? 50.0 : 0.0;
        double tax = subtotal * 0.05;
        double total = subtotal + deliveryFee + tax;

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setTotal(total);

        // Recalculate preparation time
        order.setPreparationTime(calculatePreparationTime(newItems.size()));

        Order updatedOrder = orderRepository.save(order);

        // Broadcast modification via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        log.info("Order items updated successfully: {}", updatedOrder.getOrderNumber());
        return updatedOrder;
    }

    @Transactional
    public Order updateOrderPriority(String orderId, Priority priority) {
        Order order = getOrderById(orderId);

        log.info("Updating priority for order {} from {} to {}",
                order.getOrderNumber(), order.getPriority(), priority);

        order.setPriority(priority);

        Order updatedOrder = orderRepository.save(order);

        // Broadcast priority change via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);

        return updatedOrder;
    }

    public List<Order> searchOrders(String storeId, String query) {
        return orderRepository.findByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .filter(order ->
                    order.getOrderNumber().toLowerCase().contains(query.toLowerCase()) ||
                    order.getCustomerName().toLowerCase().contains(query.toLowerCase()) ||
                    (order.getCustomerPhone() != null && order.getCustomerPhone().contains(query))
                )
                .collect(Collectors.toList());
    }

    // Helper methods

    private String generateOrderNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String randomNum = String.format("%04d", random.nextInt(10000));
        return "ORD" + timestamp.substring(timestamp.length() - 6) + randomNum;
    }

    private Integer calculatePreparationTime(int itemCount) {
        // Base time 15 minutes + 5 minutes per item
        return 15 + (itemCount * 5);
    }

    private OrderStatus getNextStatus(OrderStatus currentStatus) {
        return switch (currentStatus) {
            case RECEIVED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.OVEN;
            case OVEN -> OrderStatus.BAKED;
            case BAKED -> OrderStatus.DISPATCHED;
            case DISPATCHED -> OrderStatus.DELIVERED;
            default -> null;
        };
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus target) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot update status of completed order");
        }

        // Allow backward transitions for corrections
        if (target == OrderStatus.CANCELLED) {
            return;
        }

        // Validate forward transitions
        List<OrderStatus> validTransitions = getValidTransitions(current);
        if (!validTransitions.contains(target)) {
            throw new RuntimeException(
                String.format("Invalid status transition from %s to %s", current, target)
            );
        }
    }

    private List<OrderStatus> getValidTransitions(OrderStatus current) {
        return switch (current) {
            case RECEIVED -> List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED);
            case PREPARING -> List.of(OrderStatus.RECEIVED, OrderStatus.OVEN, OrderStatus.CANCELLED);
            case OVEN -> List.of(OrderStatus.PREPARING, OrderStatus.BAKED, OrderStatus.CANCELLED);
            case BAKED -> List.of(OrderStatus.OVEN, OrderStatus.DISPATCHED, OrderStatus.CANCELLED);
            case DISPATCHED -> List.of(OrderStatus.BAKED, OrderStatus.DELIVERED);
            default -> List.of();
        };
    }

    private void updateStatusTimestamps(Order order, OrderStatus status) {
        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case RECEIVED -> order.setReceivedAt(now);
            case PREPARING -> order.setPreparingStartedAt(now);
            case OVEN -> order.setOvenStartedAt(now);
            case BAKED -> order.setBakedAt(now);
            case DISPATCHED -> order.setDispatchedAt(now);
            case DELIVERED -> order.setDeliveredAt(now);
        }
    }

    private void validateOrderItems(List<CreateOrderRequest.OrderItemRequest> items) {
        for (CreateOrderRequest.OrderItemRequest item : items) {
            // Check availability
            if (!menuServiceClient.isMenuItemAvailable(item.getMenuItemId())) {
                throw new RuntimeException(
                    String.format("Menu item '%s' is not available", item.getName())
                );
            }

            // Validate pricing
            if (!menuServiceClient.validatePrice(item.getMenuItemId(), item.getPrice())) {
                throw new RuntimeException(
                    String.format("Invalid price for menu item '%s'", item.getName())
                );
            }
        }

        log.info("Order items validated successfully");
    }

    // Analytics methods
    public List<Order> getOrdersByDate(java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    public List<Order> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByCreatedAtBetween(start, end);
    }

    public List<Order> getOrdersByStaffAndDate(String staffId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return orderRepository.findByCreatedByAndCreatedAtBetween(staffId, startOfDay, endOfDay);
    }

    public Integer getActiveDeliveryCount() {
        return orderRepository.findActiveDeliveries().size();
    }

    // Quality Checkpoint methods
    @Transactional
    public Order addQualityCheckpoint(String orderId, com.MaSoVa.order.entity.QualityCheckpoint checkpoint) {
        Order order = getOrderById(orderId);

        if (order.getQualityCheckpoints() == null) {
            order.setQualityCheckpoints(new java.util.ArrayList<>());
        }

        checkpoint.setCheckedAt(LocalDateTime.now());
        order.getQualityCheckpoints().add(checkpoint);

        Order savedOrder = orderRepository.save(order);
        log.info("Added quality checkpoint {} to order {}", checkpoint.getType(), orderId);

        // Broadcast update
        webSocketController.sendKitchenQueueUpdate(savedOrder.getStoreId(), savedOrder);

        return savedOrder;
    }

    @Transactional
    public Order updateQualityCheckpoint(String orderId, String checkpointName,
                                         com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus status,
                                         String notes) {
        Order order = getOrderById(orderId);

        if (order.getQualityCheckpoints() == null) {
            throw new RuntimeException("No checkpoints found for order: " + orderId);
        }

        com.MaSoVa.order.entity.QualityCheckpoint checkpoint = order.getQualityCheckpoints().stream()
                .filter(cp -> cp.getCheckpointName().equals(checkpointName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Checkpoint not found: " + checkpointName));

        checkpoint.setStatus(status);
        checkpoint.setNotes(notes);
        checkpoint.setCheckedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        log.info("Updated checkpoint {} status to {} for order {}", checkpointName, status, orderId);

        // Broadcast update
        webSocketController.sendKitchenQueueUpdate(savedOrder.getStoreId(), savedOrder);

        return savedOrder;
    }

    public List<com.MaSoVa.order.entity.QualityCheckpoint> getQualityCheckpoints(String orderId) {
        Order order = getOrderById(orderId);
        return order.getQualityCheckpoints() != null ? order.getQualityCheckpoints() : new java.util.ArrayList<>();
    }

    // Preparation time tracking methods
    private void calculateAndUpdatePreparationTimes(Order order) {
        if (order.getReceivedAt() != null && order.getBakedAt() != null) {
            long totalMinutes = java.time.Duration.between(
                    order.getReceivedAt(),
                    order.getBakedAt()
            ).toMinutes();
            order.setActualPreparationTime((int) totalMinutes);
        }

        if (order.getOvenStartedAt() != null && order.getBakedAt() != null) {
            long ovenMinutes = java.time.Duration.between(
                    order.getOvenStartedAt(),
                    order.getBakedAt()
            ).toMinutes();
            order.setActualOvenTime((int) ovenMinutes);
        }
    }

    // Initialize default quality checkpoints for new orders
    private void initializeQualityCheckpoints(Order order) {
        java.util.List<com.MaSoVa.order.entity.QualityCheckpoint> checkpoints = new java.util.ArrayList<>();

        checkpoints.add(com.MaSoVa.order.entity.QualityCheckpoint.builder()
                .checkpointName("Ingredient Quality Check")
                .type(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointType.INGREDIENT_QUALITY)
                .status(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.order.entity.QualityCheckpoint.builder()
                .checkpointName("Portion Size Check")
                .type(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointType.PORTION_SIZE)
                .status(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.order.entity.QualityCheckpoint.builder()
                .checkpointName("Temperature Check")
                .type(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointType.TEMPERATURE)
                .status(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.order.entity.QualityCheckpoint.builder()
                .checkpointName("Final Inspection")
                .type(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointType.FINAL_INSPECTION)
                .status(com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        order.setQualityCheckpoints(checkpoints);
    }

    // Get orders with failed quality checks
    public List<Order> getOrdersWithFailedQualityChecks(String storeId) {
        List<Order> storeOrders = getStoreOrders(storeId);

        return storeOrders.stream()
                .filter(order -> order.getQualityCheckpoints() != null &&
                        order.getQualityCheckpoints().stream()
                                .anyMatch(cp -> cp.getStatus() == com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.FAILED))
                .collect(Collectors.toList());
    }

    // Get average preparation time for a store
    public Double getAveragePreparationTime(String storeId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);

        return orders.stream()
                .filter(order -> order.getActualPreparationTime() != null && order.getActualPreparationTime() > 0)
                .mapToInt(Order::getActualPreparationTime)
                .average()
                .orElse(0.0);
    }

    // Make-table workflow methods
    @Transactional
    public Order assignToMakeTable(String orderId, String station, String staffId, String staffName) {
        Order order = getOrderById(orderId);

        order.setAssignedMakeTableStation(station);
        order.setAssignedKitchenStaffId(staffId);
        order.setAssignedKitchenStaffName(staffName);
        order.setAssignedToKitchenAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        log.info("Assigned order {} to make-table station {} by staff {}", orderId, station, staffName);

        // Broadcast update
        webSocketController.sendKitchenQueueUpdate(savedOrder.getStoreId(), savedOrder);

        return savedOrder;
    }

    public List<Order> getOrdersByMakeTableStation(String storeId, String station) {
        return getKitchenQueue(storeId).stream()
                .filter(order -> station.equals(order.getAssignedMakeTableStation()))
                .collect(Collectors.toList());
    }

    // Kitchen analytics methods
    public java.util.Map<String, Double> getAveragePreparationTimeByMenuItem(String storeId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);

        java.util.Map<String, java.util.List<Integer>> prepTimesByItem = new java.util.HashMap<>();

        for (Order order : orders) {
            if (order.getActualPreparationTime() != null && order.getActualPreparationTime() > 0) {
                for (OrderItem item : order.getItems()) {
                    prepTimesByItem.computeIfAbsent(item.getName(), k -> new java.util.ArrayList<>())
                            .add(order.getActualPreparationTime() / order.getItems().size());
                }
            }
        }

        java.util.Map<String, Double> averages = new java.util.HashMap<>();
        for (java.util.Map.Entry<String, java.util.List<Integer>> entry : prepTimesByItem.entrySet()) {
            double avg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            averages.put(entry.getKey(), avg);
        }

        return averages;
    }

    public java.util.Map<String, Object> getKitchenStaffPerformance(String staffId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Order> assignedOrders = orderRepository.findAll().stream()
                .filter(order -> staffId.equals(order.getAssignedKitchenStaffId()))
                .filter(order -> order.getCreatedAt().isAfter(startOfDay) && order.getCreatedAt().isBefore(endOfDay))
                .toList();

        int totalOrders = assignedOrders.size();
        int completedOrders = (int) assignedOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.DISPATCHED)
                .count();

        double avgPrepTime = assignedOrders.stream()
                .filter(order -> order.getActualPreparationTime() != null)
                .mapToInt(Order::getActualPreparationTime)
                .average()
                .orElse(0.0);

        int failedQualityChecks = (int) assignedOrders.stream()
                .filter(order -> order.getQualityCheckpoints() != null &&
                        order.getQualityCheckpoints().stream()
                                .anyMatch(cp -> cp.getStatus() == com.MaSoVa.order.entity.QualityCheckpoint.CheckpointStatus.FAILED))
                .count();

        java.util.Map<String, Object> performance = new java.util.HashMap<>();
        performance.put("staffId", staffId);
        performance.put("totalOrders", totalOrders);
        performance.put("completedOrders", completedOrders);
        performance.put("averagePreparationTime", avgPrepTime);
        performance.put("failedQualityChecks", failedQualityChecks);
        performance.put("completionRate", totalOrders > 0 ? (completedOrders * 100.0 / totalOrders) : 0.0);

        return performance;
    }

    // Get prep time distribution for bottleneck analysis
    public java.util.Map<String, Object> getPreparationTimeDistribution(String storeId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);

        List<Integer> prepTimes = orders.stream()
                .filter(order -> order.getActualPreparationTime() != null && order.getActualPreparationTime() > 0)
                .map(Order::getActualPreparationTime)
                .sorted()
                .toList();

        if (prepTimes.isEmpty()) {
            return java.util.Map.of(
                    "min", 0,
                    "max", 0,
                    "average", 0.0,
                    "median", 0.0,
                    "p90", 0.0,
                    "p95", 0.0
            );
        }

        int size = prepTimes.size();
        double avg = prepTimes.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        int median = prepTimes.get(size / 2);
        int p90 = prepTimes.get((int) (size * 0.9));
        int p95 = prepTimes.get((int) (size * 0.95));

        return java.util.Map.of(
                "min", prepTimes.get(0),
                "max", prepTimes.get(size - 1),
                "average", avg,
                "median", median,
                "p90", p90,
                "p95", p95,
                "totalOrders", size
        );
    }
}
