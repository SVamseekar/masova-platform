package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.Priority;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.MaSoVa.commerce.order.client.MenuServiceClient;
import com.MaSoVa.commerce.order.client.CustomerServiceClient;
import com.MaSoVa.commerce.order.client.DeliveryServiceClient;
import com.MaSoVa.commerce.order.client.StoreServiceClient;
import com.MaSoVa.commerce.order.client.InventoryServiceClient;
import com.MaSoVa.commerce.order.config.TaxConfiguration;
import com.MaSoVa.commerce.order.config.PreparationTimeConfiguration;
import com.MaSoVa.commerce.order.config.DeliveryFeeConfiguration;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.model.VatBreakdown;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.Comparator;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final OrderRepository orderRepository;
    private final OrderJpaRepository orderJpaRepository;
    private final OrderItemSyncService orderItemSyncService;
    private final ObjectMapper objectMapper;
    private final OrderWebSocketController webSocketController;
    private final MenuServiceClient menuServiceClient;
    private final CustomerServiceClient customerServiceClient;
    private final CustomerNotificationService customerNotificationService;
    private final DeliveryServiceClient deliveryServiceClient;
    private final StoreServiceClient storeServiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final TaxConfiguration taxConfiguration;
    private final PreparationTimeConfiguration preparationTimeConfiguration;
    private final DeliveryFeeConfiguration deliveryFeeConfiguration;
    private final OrderEventPublisher orderEventPublisher;
    private final EuVatEngine euVatEngine;
    private final Random random = new Random();

    public OrderService(OrderRepository orderRepository,
                       OrderJpaRepository orderJpaRepository,
                       OrderItemSyncService orderItemSyncService,
                       ObjectMapper objectMapper,
                       OrderWebSocketController webSocketController,
                       MenuServiceClient menuServiceClient, CustomerServiceClient customerServiceClient,
                       CustomerNotificationService customerNotificationService,
                       DeliveryServiceClient deliveryServiceClient,
                       StoreServiceClient storeServiceClient,
                       InventoryServiceClient inventoryServiceClient,
                       TaxConfiguration taxConfiguration,
                       PreparationTimeConfiguration preparationTimeConfiguration,
                       DeliveryFeeConfiguration deliveryFeeConfiguration,
                       OrderEventPublisher orderEventPublisher,
                       EuVatEngine euVatEngine) {
        this.orderRepository = orderRepository;
        this.orderJpaRepository = orderJpaRepository;
        this.orderItemSyncService = orderItemSyncService;
        this.objectMapper = objectMapper;
        this.webSocketController = webSocketController;
        this.menuServiceClient = menuServiceClient;
        this.customerServiceClient = customerServiceClient;
        this.customerNotificationService = customerNotificationService;
        this.deliveryServiceClient = deliveryServiceClient;
        this.storeServiceClient = storeServiceClient;
        this.inventoryServiceClient = inventoryServiceClient;
        this.taxConfiguration = taxConfiguration;
        this.preparationTimeConfiguration = preparationTimeConfiguration;
        this.deliveryFeeConfiguration = deliveryFeeConfiguration;
        this.orderEventPublisher = orderEventPublisher;
        this.euVatEngine = euVatEngine;
    }

    @Transactional
    @CacheEvict(value = "salesMetrics", allEntries = true)
    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerName());

        // Validate stock availability and pricing
        validateOrderItems(request.getItems());

        // Convert request items to order items
        List<OrderItem> orderItems = request.getItems().stream()
                .map(item -> {
                    OrderItem oi = OrderItem.builder()
                            .menuItemId(item.getMenuItemId())
                            .name(item.getName())
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .variant(item.getVariant())
                            .customizations(item.getCustomizations())
                            .build();
                    oi.setCategory(item.getCategory());
                    return oi;
                })
                .collect(Collectors.toList());

        // Calculate totals
        double subtotal = orderItems.stream()
                .mapToDouble(OrderItem::getItemTotal)
                .sum();

        // HARD-001: Dynamic delivery fee calculation using DeliveryZoneService
        double deliveryFee = 0.0;
        Integer estimatedDeliveryMinutes = null;
        if (Order.OrderType.DELIVERY.equals(request.getOrderType())) {
            if (request.getDeliveryAddress() != null &&
                request.getDeliveryAddress().getLatitude() != null &&
                request.getDeliveryAddress().getLongitude() != null) {

                // Validate delivery address is within store's delivery radius
                boolean withinRadius = storeServiceClient.isWithinDeliveryRadius(
                    request.getStoreId(),
                    request.getDeliveryAddress().getLatitude(),
                    request.getDeliveryAddress().getLongitude()
                );
                if (!withinRadius) {
                    throw new IllegalArgumentException(
                        "Delivery address is outside this store's delivery radius. Please choose a different store or select Takeaway."
                    );
                }

                DeliveryServiceClient.DeliveryFeeResult feeResult = deliveryServiceClient.calculateDeliveryFee(
                    request.getStoreId(),
                    request.getDeliveryAddress().getLatitude(),
                    request.getDeliveryAddress().getLongitude()
                );

                deliveryFee = feeResult.getDeliveryFee();
                estimatedDeliveryMinutes = feeResult.getEstimatedMinutes();

                if (feeResult.isUsedDefault()) {
                    log.warn("Using default delivery fee for order - {}", feeResult.getError());
                } else {
                    log.info("Delivery fee calculated: ₹{} (Zone: {}, Distance: {} km)",
                            deliveryFee, feeResult.getZoneName(), feeResult.getDistanceKm());
                }
            } else {
                // Fallback if address coordinates are missing - use base fee from configuration
                deliveryFee = deliveryFeeConfiguration.getBaseFee();
                log.warn("Delivery address coordinates missing, using fallback base fee: ₹{}", deliveryFee);
            }
        }

        // Tax / VAT routing: EU stores → EuVatEngine; India stores → TaxConfiguration (GST)
        Store store = storeServiceClient.getStore(request.getStoreId());
        String countryCode = store.getCountryCode();

        double tax;
        VatBreakdown vatBreakdown = null;

        if (countryCode != null && !countryCode.isBlank()) {
            // EU / international store — calculate per-line VAT
            String orderContext = request.getOrderType() != null ? request.getOrderType().name() : "DINE_IN";
            vatBreakdown = euVatEngine.calculate(countryCode, orderContext, orderItems);
            tax = vatBreakdown.getTotalVatAmount().doubleValue();
            log.debug("EU VAT calculated for country {} context {}: {}", countryCode, orderContext, tax);
        } else {
            // India store — existing GST path unchanged
            String state = (request.getDeliveryAddress() != null && request.getDeliveryAddress().getState() != null)
                    ? request.getDeliveryAddress().getState()
                    : "Maharashtra";
            tax = taxConfiguration.calculateTax(subtotal, state, true);
            log.debug("GST calculated for state {}: ₹{} ({} GST)",
                    state, tax, taxConfiguration.getTaxRateForState(state));
        }

        double total = subtotal + deliveryFee + tax;

        // Generate unique order number
        String orderNumber = generateOrderNumber();

        // Build order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())  // Store email for notifications
                .storeId(request.getStoreId())
                .items(orderItems)
                .subtotal(BigDecimal.valueOf(subtotal))
                .deliveryFee(BigDecimal.valueOf(deliveryFee))
                .tax(BigDecimal.valueOf(tax))
                .total(BigDecimal.valueOf(total))
                .status(OrderStatus.RECEIVED)
                .orderType(request.getOrderType())
                .paymentStatus(Order.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .priority(Priority.NORMAL)
                .deliveryAddress(request.getDeliveryAddress())
                .specialInstructions(request.getSpecialInstructions())
                .createdByStaffId(request.getCreatedByStaffId())
                .createdByStaffName(request.getCreatedByStaffName())
                .preparationTime(calculatePreparationTime(orderItems.size()))
                .receivedAt(LocalDateTime.now())
                .build();

        // Attach VAT breakdown for EU orders
        if (vatBreakdown != null) {
            order.setVatCountryCode(vatBreakdown.getVatCountryCode());
            order.setVatBreakdown(vatBreakdown);
            order.setTotalNetAmount(vatBreakdown.getTotalNetAmount());
            order.setTotalVatAmount(vatBreakdown.getTotalVatAmount());
            order.setTotalGrossAmount(vatBreakdown.getTotalGrossAmount());
        }

        // Calculate estimated delivery time
        if (Order.OrderType.DELIVERY.equals(request.getOrderType())) {
            // Use dynamic delivery time from DeliveryZoneService if available, otherwise default to 30 minutes
            int deliveryTimeMinutes = (estimatedDeliveryMinutes != null) ? estimatedDeliveryMinutes : 30;
            order.setEstimatedDeliveryTime(
                    LocalDateTime.now().plusMinutes(order.getPreparationTime() + deliveryTimeMinutes)
            );
            log.debug("Estimated delivery time set: {} minutes (prep: {}, delivery: {})",
                    order.getPreparationTime() + deliveryTimeMinutes, order.getPreparationTime(), deliveryTimeMinutes);
        }

        // Initialize quality checkpoints for the order
        initializeQualityCheckpoints(order);

        // Update customer email if provided (for walk-in customers)
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().trim().isEmpty() &&
            request.getCustomerId() != null && !request.getCustomerId().trim().isEmpty()) {
            customerServiceClient.updateCustomerEmail(request.getCustomerId(), request.getCustomerEmail());
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {}", savedOrder.getOrderNumber());

        // Phase 2 dual-write: sync to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.save(toOrderJpaEntity(savedOrder));
        } catch (Exception e) {
            log.warn("PG dual-write failed for createOrder orderNumber={}: {}", savedOrder.getOrderNumber(), e.getMessage());
        }

        // Publish order created event to RabbitMQ
        try {
            orderEventPublisher.publishOrderCreated(new OrderCreatedEvent(
                savedOrder.getId(), savedOrder.getCustomerId(), savedOrder.getStoreId(),
                savedOrder.getOrderType().toString(), savedOrder.getTotal(), "INR"));
        } catch (Exception e) {
            log.warn("Failed to publish order created event for {}: {}", savedOrder.getOrderNumber(), e.getMessage());
        }

        // Update customer stats immediately after order creation
        if (savedOrder.getCustomerId() != null && !savedOrder.getCustomerId().isEmpty()) {
            customerServiceClient.updateOrderStats(
                savedOrder.getCustomerId(),
                savedOrder.getOrderNumber(),
                savedOrder.getOrderType().toString(),
                "RECEIVED", // Initial status
                savedOrder.getTotal().doubleValue()
            );
        }

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
        // Kitchen queue shows active orders: RECEIVED through READY (all types), plus DISPATCHED and OUT_FOR_DELIVERY (delivery in-flight)
        List<OrderStatus> kitchenStatuses = List.of(
                OrderStatus.RECEIVED,
                OrderStatus.PREPARING,
                OrderStatus.OVEN,
                OrderStatus.BAKED,
                OrderStatus.READY,
                OrderStatus.DISPATCHED,
                OrderStatus.OUT_FOR_DELIVERY
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

    public List<Order> getOrdersByStatus(String storeId, OrderStatus status) {
        log.info("Fetching orders with status {} for store {}", status, storeId);
        return orderRepository.findByStoreIdAndStatus(storeId, status);
    }

    public List<Order> getCustomerOrders(String customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    @CacheEvict(value = {"salesMetrics", "staffLeaderboard", "staffPerformance",
                         "driverStatus", "salesTrends", "orderTypeBreakdown",
                         "peakHours", "topProducts"}, allEntries = true)
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

        // Set completedAt for DELIVERED (SERVED/COMPLETED are handled in updateStatusTimestamps)
        if (newStatus == OrderStatus.DELIVERED) {
            order.setCompletedAt(LocalDateTime.now());
        }

        // Generate delivery OTP when DELIVERY order is dispatched (also covers direct status-change path)
        if (newStatus == OrderStatus.DISPATCHED && order.getOrderType() == Order.OrderType.DELIVERY
                && order.getDeliveryOtp() == null) {
            generateAndSetDeliveryOtp(order);
        }

        Order updatedOrder = orderRepository.save(order);
        log.info("Order status updated: {} → {} - Analytics cache evicted",
                 updatedOrder.getOrderNumber(), updatedOrder.getStatus());

        // Inventory management on status transition
        if (newStatus == OrderStatus.PREPARING) {
            updatedOrder.getItems().forEach(item -> {
                try {
                    inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                        "quantityChange", -item.getQuantity(),
                        "reason", "Order " + updatedOrder.getOrderNumber() + " started preparing"
                    ));
                    log.info("Decremented inventory for item {} qty={}", item.getMenuItemId(), item.getQuantity());
                } catch (Exception e) {
                    log.warn("Failed to decrement inventory for item {}: {}", item.getMenuItemId(), e.getMessage());
                }
            });
        } else if (newStatus == OrderStatus.CANCELLED && currentStatus != null
                && List.of(OrderStatus.PREPARING, OrderStatus.OVEN, OrderStatus.BAKED, OrderStatus.READY, OrderStatus.DISPATCHED, OrderStatus.OUT_FOR_DELIVERY).contains(currentStatus)) {
            // Restore inventory for any status after PREPARING (stock was already decremented)
            updatedOrder.getItems().forEach(item -> {
                try {
                    inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                        "quantityChange", item.getQuantity(),
                        "reason", "Order " + updatedOrder.getOrderNumber() + " cancelled after preparation started"
                    ));
                    log.info("Restored inventory for cancelled order item {} qty={}", item.getMenuItemId(), item.getQuantity());
                } catch (Exception e) {
                    log.warn("Failed to restore inventory for cancelled order item {}: {}", item.getMenuItemId(), e.getMessage());
                }
            });
        }

        // Phase 2 dual-write: sync status + timestamps to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> { updateOrderJpaEntityFields(pgOrder, updatedOrder); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for updateOrderStatus orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for updateOrderStatus orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

        // Publish status changed event to RabbitMQ
        try {
            orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
                updatedOrder.getId(), updatedOrder.getCustomerId(),
                currentStatus.toString(), newStatus.toString(), updatedOrder.getStoreId()));
        } catch (Exception e) {
            log.warn("Failed to publish status changed event for {}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

        // Update customer stats for all terminal statuses (loyalty points)
        if ((newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.SERVED)
                && updatedOrder.getCustomerId() != null && !updatedOrder.getCustomerId().isEmpty()) {
            customerServiceClient.updateOrderStats(
                updatedOrder.getCustomerId(),
                updatedOrder.getOrderNumber(),
                updatedOrder.getOrderType().toString(),
                "COMPLETED", // Mark as completed for loyalty points
                updatedOrder.getTotal().doubleValue()
            );
        }

        // Broadcast status update via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
        webSocketController.sendOrderUpdateToStore(updatedOrder.getStoreId(), updatedOrder);
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        // Send customer notification for status change
        customerNotificationService.sendOrderStatusNotification(updatedOrder, currentStatus);

        // Send OTP email when DELIVERY order is dispatched (covers direct status-update path)
        if (newStatus == OrderStatus.DISPATCHED && updatedOrder.getDeliveryOtp() != null) {
            try {
                customerNotificationService.sendDeliveryOtpNotification(updatedOrder, updatedOrder.getDeliveryOtp());
            } catch (Exception e) {
                log.warn("Failed to send OTP notification for order {}: {}", updatedOrder.getOrderNumber(), e.getMessage());
            }
        }

        return updatedOrder;
    }

    @Transactional
    @CacheEvict(value = {"salesMetrics", "staffLeaderboard", "staffPerformance",
                         "driverStatus", "salesTrends", "orderTypeBreakdown",
                         "peakHours", "topProducts"}, allEntries = true)
    public Order moveOrderToNextStage(String orderId) {
        Order order = getOrderById(orderId);
        OrderStatus currentStatus = order.getStatus();
        OrderStatus nextStatus = getNextStatus(currentStatus, order.getOrderType());

        if (nextStatus == null) {
            throw new RuntimeException("Order is already in final stage");
        }

        log.info("Moving order {} ({}) from {} to {}",
                order.getOrderNumber(), order.getOrderType(), currentStatus, nextStatus);

        order.setStatus(nextStatus);
        updateStatusTimestamps(order, nextStatus);

        // Calculate preparation times when order reaches BAKED or later stages
        if (nextStatus == OrderStatus.BAKED || nextStatus == OrderStatus.DISPATCHED || nextStatus == OrderStatus.DELIVERED) {
            calculateAndUpdatePreparationTimes(order);
        }

        // Set completedAt for terminal statuses
        if (nextStatus == OrderStatus.DELIVERED || nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.SERVED) {
            order.setCompletedAt(LocalDateTime.now());
        }

        // Auto-generate delivery OTP when DELIVERY order is dispatched
        if (nextStatus == OrderStatus.DISPATCHED && order.getOrderType() == Order.OrderType.DELIVERY) {
            generateAndSetDeliveryOtp(order);
        }

        Order updatedOrder = orderRepository.save(order);

        // Decrement inventory when order reaches PREPARING (mirrors updateOrderStatus path)
        if (nextStatus == OrderStatus.PREPARING) {
            updatedOrder.getItems().forEach(item -> {
                try {
                    inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                        "quantityChange", -item.getQuantity(),
                        "reason", "Order " + updatedOrder.getOrderNumber() + " started preparing"
                    ));
                    log.info("Decremented inventory for item {} qty={}", item.getMenuItemId(), item.getQuantity());
                } catch (Exception e) {
                    log.warn("Failed to decrement inventory for item {}: {}", item.getMenuItemId(), e.getMessage());
                }
            });
        }

        // Phase 2 dual-write: sync status + OTP + timestamps to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> { updateOrderJpaEntityFields(pgOrder, updatedOrder); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for moveOrderToNextStage orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for moveOrderToNextStage orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

        // Publish status changed event to RabbitMQ
        try {
            orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
                updatedOrder.getId(), updatedOrder.getCustomerId(),
                currentStatus.toString(), nextStatus.toString(), updatedOrder.getStoreId()));
        } catch (Exception e) {
            log.warn("Failed to publish status changed event for {}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

        // Update customer stats when order reaches terminal status
        if ((nextStatus == OrderStatus.DELIVERED || nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.SERVED)
                && updatedOrder.getCustomerId() != null && !updatedOrder.getCustomerId().isEmpty()) {
            log.info("Updating customer stats for order {} reaching terminal status {}",
                    updatedOrder.getOrderNumber(), nextStatus);
            customerServiceClient.updateOrderStats(
                updatedOrder.getCustomerId(),
                updatedOrder.getOrderNumber(),
                updatedOrder.getOrderType().toString(),
                "COMPLETED",
                updatedOrder.getTotal().doubleValue()
            );
        }

        // Broadcast status update via WebSocket
        webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
        webSocketController.sendOrderUpdateToStore(updatedOrder.getStoreId(), updatedOrder);
        if (updatedOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
        }

        // Send customer notification for status change
        customerNotificationService.sendOrderStatusNotification(updatedOrder, currentStatus);

        // Send OTP email when dispatched
        if (nextStatus == OrderStatus.DISPATCHED && updatedOrder.getDeliveryOtp() != null) {
            try {
                customerNotificationService.sendDeliveryOtpNotification(updatedOrder, updatedOrder.getDeliveryOtp());
            } catch (Exception e) {
                log.warn("Failed to send OTP notification for order {}: {}", updatedOrder.getOrderNumber(), e.getMessage());
            }
        }

        return updatedOrder;
    }

    @Transactional
    @CacheEvict(value = "salesMetrics", allEntries = true)
    public Order cancelOrder(String orderId, String reason) {
        Order order = getOrderById(orderId);
        OrderStatus previousStatus = order.getStatus(); // Capture before change

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel delivered order");
        }

        log.info("Cancelling order: {}", order.getOrderNumber());

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(reason);

        Order cancelledOrder = orderRepository.save(order);

        // Restore inventory if order was in any post-PREPARING state when cancelled (stock was decremented at PREPARING)
        if (List.of(OrderStatus.PREPARING, OrderStatus.OVEN, OrderStatus.BAKED, OrderStatus.READY, OrderStatus.DISPATCHED, OrderStatus.OUT_FOR_DELIVERY).contains(previousStatus)) {
            cancelledOrder.getItems().forEach(item -> {
                try {
                    inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                        "quantityChange", item.getQuantity(),
                        "reason", "Order " + cancelledOrder.getOrderNumber() + " cancelled after preparation started"
                    ));
                    log.info("Restored inventory for cancelled order item {} qty={}", item.getMenuItemId(), item.getQuantity());
                } catch (Exception e) {
                    log.warn("Failed to restore inventory for cancelled order item {}: {}", item.getMenuItemId(), e.getMessage());
                }
            });
        }

        // Phase 2 dual-write: sync cancellation to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(cancelledOrder.getId()).ifPresentOrElse(
                pgOrder -> { updateOrderJpaEntityFields(pgOrder, cancelledOrder); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for cancelOrder orderId={}", cancelledOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for cancelOrder orderNumber={}: {}", cancelledOrder.getOrderNumber(), e.getMessage());
        }

        // Publish status changed event to RabbitMQ
        try {
            orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
                cancelledOrder.getId(), cancelledOrder.getCustomerId(),
                previousStatus.toString(), "CANCELLED", cancelledOrder.getStoreId()));
        } catch (Exception e) {
            log.warn("Failed to publish cancel event for {}: {}", cancelledOrder.getOrderNumber(), e.getMessage());
        }

        // Broadcast cancellation via WebSocket
        webSocketController.sendKitchenQueueUpdate(cancelledOrder.getStoreId(), cancelledOrder);
        webSocketController.sendOrderUpdateToStore(cancelledOrder.getStoreId(), cancelledOrder);
        if (cancelledOrder.getCustomerId() != null) {
            webSocketController.sendOrderUpdateToCustomer(cancelledOrder.getCustomerId(), cancelledOrder);
        }

        // Send customer notification for cancellation
        customerNotificationService.sendOrderStatusNotification(cancelledOrder, previousStatus);

        return cancelledOrder;
    }

    @Transactional
    public Order assignDriver(String orderId, String driverId) {
        return assignDriver(orderId, driverId, null, null);
    }

    @Transactional
    public Order assignDriver(String orderId, String driverId, String driverName, String driverPhone) {
        Order order = getOrderById(orderId);

        if (order.getOrderType() != Order.OrderType.DELIVERY) {
            throw new RuntimeException("Cannot assign driver to non-delivery order");
        }

        order.setAssignedDriverId(driverId);
        Order updatedOrder = orderRepository.save(order);

        // Phase 2 dual-write: sync driver assignment to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> { pgOrder.setAssignedDriverId(driverId); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for assignDriver orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for assignDriver orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

        // Send driver assignment notification to customer
        customerNotificationService.sendDriverAssignmentNotification(updatedOrder, driverName, driverPhone);

        // Notify driver via WebSocket
        webSocketController.sendOrderUpdateToDriver(driverId, updatedOrder);

        log.info("Driver {} assigned to order {}", driverId, order.getOrderNumber());

        return updatedOrder;
    }

    @Transactional
    public Order updatePaymentStatus(String orderId, Order.PaymentStatus paymentStatus, String transactionId) {
        Order order = getOrderById(orderId);
        order.setPaymentStatus(paymentStatus);
        order.setPaymentTransactionId(transactionId);

        Order updatedOrder = orderRepository.save(order);

        // Phase 2 dual-write: sync payment status + transaction ID to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> {
                    pgOrder.setPaymentStatus(paymentStatus.name());
                    pgOrder.setPaymentTransactionId(transactionId);
                    orderJpaRepository.save(pgOrder);
                },
                () -> log.warn("PG dual-write: no PG row found for updatePaymentStatus orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for updatePaymentStatus orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

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

        // Preserve the zone-based delivery fee from the original order (do not flatten to base fee)
        double deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee().doubleValue() : 0.0;

        // Get state from order's delivery address or default
        String state = (order.getDeliveryAddress() != null && order.getDeliveryAddress().getState() != null)
                ? order.getDeliveryAddress().getState()
                : "Maharashtra";
        double tax = taxConfiguration.calculateTax(subtotal, state, true);
        double total = subtotal + deliveryFee + tax;

        order.setSubtotal(BigDecimal.valueOf(subtotal));
        order.setTax(BigDecimal.valueOf(tax));
        order.setTotal(BigDecimal.valueOf(total));

        // Recalculate preparation time
        order.setPreparationTime(calculatePreparationTime(newItems.size()));

        Order updatedOrder = orderRepository.save(order);

        // Phase 2 dual-write: sync recalculated totals + re-map line items to PostgreSQL (non-blocking)
        // Uses OrderItemSyncService.syncOrderItems (REQUIRES_NEW) to atomically delete + reinsert items.
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> orderItemSyncService.syncOrderItems(pgOrder, updatedOrder),
                () -> log.warn("PG dual-write: no PG row found for updateOrderItems orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for updateOrderItems orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

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

        // Phase 2 dual-write: sync priority to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(updatedOrder.getId()).ifPresentOrElse(
                pgOrder -> { pgOrder.setPriority(priority.name()); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for updateOrderPriority orderId={}", updatedOrder.getId())
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for updateOrderPriority orderNumber={}: {}", updatedOrder.getOrderNumber(), e.getMessage());
        }

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

    /**
     * HARD-003: Calculate preparation time using configurable PreparationTimeConfiguration
     * instead of hardcoded values.
     *
     * @param itemCount Number of items in the order
     * @return Estimated preparation time in minutes
     */
    private Integer calculatePreparationTime(int itemCount) {
        int prepTime = preparationTimeConfiguration.calculatePreparationTime(itemCount);

        if (preparationTimeConfiguration.isRushHour()) {
            log.debug("Rush hour detected - applying {}x multiplier to preparation time",
                    preparationTimeConfiguration.getRushHourMultiplier());
        }

        log.debug("Calculated preparation time for {} items: {} minutes", itemCount, prepTime);
        return prepTime;
    }

    private OrderStatus getNextStatus(OrderStatus currentStatus, Order.OrderType orderType) {
        return switch (currentStatus) {
            case RECEIVED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.OVEN;
            case OVEN -> OrderStatus.BAKED;
            case BAKED -> OrderStatus.READY;  // All orders go to READY after BAKED
            case READY -> {
                // Different terminal states based on order type
                yield switch (orderType) {
                    case DELIVERY -> OrderStatus.DISPATCHED;  // DELIVERY: READY → DISPATCHED → DELIVERED
                    case TAKEAWAY -> OrderStatus.COMPLETED;   // TAKEAWAY: READY → COMPLETED
                    case DINE_IN -> OrderStatus.SERVED;       // DINE_IN: READY → SERVED
                };
            }
            case DISPATCHED -> OrderStatus.OUT_FOR_DELIVERY;  // DELIVERY: DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
            case OUT_FOR_DELIVERY -> OrderStatus.DELIVERED;  // Driver en route → delivered
            default -> null;  // Already in terminal state (DELIVERED, COMPLETED, SERVED, CANCELLED)
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
            case PREPARING -> List.of(OrderStatus.RECEIVED, OrderStatus.OVEN, OrderStatus.READY, OrderStatus.CANCELLED);  // Can skip OVEN for drinks
            case OVEN -> List.of(OrderStatus.PREPARING, OrderStatus.BAKED, OrderStatus.CANCELLED);
            case BAKED -> List.of(OrderStatus.OVEN, OrderStatus.READY, OrderStatus.CANCELLED);  // Unified: go to READY
            case READY -> List.of(OrderStatus.DISPATCHED, OrderStatus.SERVED, OrderStatus.COMPLETED, OrderStatus.CANCELLED);  // Different final states per order type
            case DISPATCHED -> List.of(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY);  // DELIVERY orders
            case OUT_FOR_DELIVERY -> List.of(OrderStatus.DISPATCHED, OrderStatus.DELIVERED);  // Driver en route
            case DELIVERED -> List.of();  // Terminal state
            case SERVED -> List.of();  // Terminal state (DINE_IN)
            case COMPLETED -> List.of();  // Terminal state (TAKEAWAY)
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
            case READY -> order.setReadyAt(now);  // Ready for pickup (TAKEAWAY) or serving (DINE_IN) or dispatch (DELIVERY)
            case DISPATCHED -> order.setDispatchedAt(now);
            case OUT_FOR_DELIVERY -> { /* dispatchedAt already set at DISPATCHED — no dedicated field */ }
            case DELIVERED -> order.setDeliveredAt(now);
            case SERVED -> order.setCompletedAt(now);  // DINE_IN final state
            case COMPLETED -> order.setCompletedAt(now);  // TAKEAWAY final state
            case CANCELLED -> {
                // No specific timestamp field for cancelled - updatedAt will be set automatically
            }
        }
    }

    private void validateOrderItems(List<CreateOrderRequest.OrderItemRequest> items) {
        for (CreateOrderRequest.OrderItemRequest item : items) {
            // Validate menuItemId is present
            if (item.getMenuItemId() == null || item.getMenuItemId().trim().isEmpty()) {
                log.error("Menu item ID is missing for item: {}. This indicates a frontend or database issue.", item.getName());
                throw new RuntimeException(
                    String.format("Menu item ID is required for '%s'. Please contact support.", item.getName())
                );
            }

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
    public List<Order> getOrdersByDate(String storeId, java.time.LocalDate date) {
        // FIXED: Use IST timezone consistently with analytics service
        // Analytics service uses Asia/Kolkata for date calculations, so we must use the same timezone here

        // Convert date to IST timezone boundaries (start and end of day in IST)
        java.time.ZonedDateTime zonedStart = date.atStartOfDay(IST);
        java.time.ZonedDateTime zonedEnd = date.atTime(23, 59, 59, 999_999_999).atZone(IST);

        // Convert IST to UTC for MongoDB query (MongoDB stores timestamps in UTC)
        LocalDateTime startOfDay = zonedStart.withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime endOfDay = zonedEnd.withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();

        log.debug("Querying orders for date {} (IST): {} to {} (UTC)", date, startOfDay, endOfDay);

        return orderRepository.findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);
    }

    public List<Order> getOrdersByDateRange(String storeId, LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end);
    }

    public List<Order> getOrdersByStaffAndDate(String storeId, String staffId, java.time.LocalDate date) {
        // FIXED: Use IST timezone consistently with analytics service

        // Convert date to IST timezone boundaries
        java.time.ZonedDateTime zonedStart = date.atStartOfDay(IST);
        java.time.ZonedDateTime zonedEnd = date.atTime(23, 59, 59, 999_999_999).atZone(IST);

        // Convert IST to UTC for MongoDB query
        LocalDateTime startOfDay = zonedStart.withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime endOfDay = zonedEnd.withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();

        log.debug("Querying orders for staff {} on date {} (IST): {} to {} (UTC)",
                  staffId, date, startOfDay, endOfDay);

        return orderRepository.findByStoreIdAndCreatedByAndCreatedAtBetween(storeId, staffId, startOfDay, endOfDay);
    }

    public Integer getActiveDeliveryCount(String storeId) {
        return orderRepository.findActiveDeliveriesByStoreId(storeId).size();
    }

    // Quality Checkpoint methods
    @Transactional
    public Order addQualityCheckpoint(String orderId, com.MaSoVa.commerce.order.entity.QualityCheckpoint checkpoint) {
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
                                         com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus status,
                                         String notes) {
        Order order = getOrderById(orderId);

        if (order.getQualityCheckpoints() == null) {
            throw new RuntimeException("No checkpoints found for order: " + orderId);
        }

        com.MaSoVa.commerce.order.entity.QualityCheckpoint checkpoint = order.getQualityCheckpoints().stream()
                .filter(cp -> cp.getCheckpointName() != null && cp.getCheckpointName().equals(checkpointName))
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

    public List<com.MaSoVa.commerce.order.entity.QualityCheckpoint> getQualityCheckpoints(String orderId) {
        Order order = getOrderById(orderId);
        return order.getQualityCheckpoints() != null ? order.getQualityCheckpoints() : new java.util.ArrayList<>();
    }

    private void generateAndSetDeliveryOtp(Order order) {
        String otp = String.format("%04d", new java.util.Random().nextInt(10000));
        LocalDateTime now = LocalDateTime.now();
        order.setDeliveryOtp(otp);
        order.setDeliveryOtpGeneratedAt(now);
        order.setDeliveryOtpExpiresAt(now.plusMinutes(15));
        log.info("Generated delivery OTP for order {}", order.getOrderNumber());
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
        java.util.List<com.MaSoVa.commerce.order.entity.QualityCheckpoint> checkpoints = new java.util.ArrayList<>();

        checkpoints.add(com.MaSoVa.commerce.order.entity.QualityCheckpoint.builder()
                .checkpointName("Ingredient Quality Check")
                .type(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointType.INGREDIENT_QUALITY)
                .status(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.commerce.order.entity.QualityCheckpoint.builder()
                .checkpointName("Portion Size Check")
                .type(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointType.PORTION_SIZE)
                .status(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.commerce.order.entity.QualityCheckpoint.builder()
                .checkpointName("Temperature Check")
                .type(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointType.TEMPERATURE)
                .status(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        checkpoints.add(com.MaSoVa.commerce.order.entity.QualityCheckpoint.builder()
                .checkpointName("Final Inspection")
                .type(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointType.FINAL_INSPECTION)
                .status(com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.PENDING)
                .build());

        order.setQualityCheckpoints(checkpoints);
    }

    // Get orders with failed quality checks
    public List<Order> getOrdersWithFailedQualityChecks(String storeId) {
        List<Order> storeOrders = getStoreOrders(storeId);

        return storeOrders.stream()
                .filter(order -> order.getQualityCheckpoints() != null &&
                        order.getQualityCheckpoints().stream()
                                .anyMatch(cp -> cp.getStatus() == com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.FAILED))
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

        // Use dedicated query instead of findAll() to avoid loading all orders into memory
        List<Order> assignedOrders = orderRepository.findByAssignedKitchenStaffIdAndCreatedAtBetween(
                staffId, startOfDay, endOfDay);

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
                                .anyMatch(cp -> cp.getStatus() == com.MaSoVa.commerce.order.entity.QualityCheckpoint.CheckpointStatus.FAILED))
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

    public com.MaSoVa.commerce.order.dto.PosStaffPerformanceDTO getPosStaffPerformance(String staffId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Query orders created by this POS staff member
        List<Order> staffOrders = orderRepository.findByCreatedByStaffIdAndCreatedAtBetween(
                staffId, startDateTime, endDateTime);

        // Calculate metrics
        long totalOrders = staffOrders.size();
        BigDecimal totalRevenue = staffOrders.stream()
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long completedOrders = staffOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .count();
        long cancelledOrders = staffOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.CANCELLED)
                .count();

        // Get staff name from first order if available
        String staffName = staffOrders.isEmpty() ? null : staffOrders.get(0).getCreatedByStaffName();

        return new com.MaSoVa.commerce.order.dto.PosStaffPerformanceDTO(
                totalOrders,
                totalRevenue,
                completedOrders,
                cancelledOrders,
                staffId,
                staffName
        );
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

    // ─────────────────────────────────────────────────────────────────────────────
    // Phase 2 dual-write helpers — MongoDB Order → PostgreSQL OrderJpaEntity
    // ─────────────────────────────────────────────────────────────────────────────

    private OffsetDateTime toOdt(LocalDateTime ldt) {
        return ldt != null ? ldt.atZone(IST).toOffsetDateTime() : null;
    }

    private OrderJpaEntity toOrderJpaEntity(Order order) {
        String deliveryAddressJson = null;
        if (order.getDeliveryAddress() != null) {
            try {
                deliveryAddressJson = objectMapper.writeValueAsString(order.getDeliveryAddress());
            } catch (Exception e) {
                log.warn("PG dual-write: failed to serialize deliveryAddress for order {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        // Serialize VAT breakdown as JSON for JSONB column
        String vatBreakdownJson = null;
        if (order.getVatBreakdown() != null) {
            try {
                vatBreakdownJson = objectMapper.writeValueAsString(order.getVatBreakdown());
            } catch (Exception e) {
                log.warn("PG dual-write: failed to serialize vatBreakdown for order {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        OrderJpaEntity entity = OrderJpaEntity.builder()
            .id(order.getId())
            .mongoId(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomerId())
            .customerName(order.getCustomerName())
            .customerPhone(order.getCustomerPhone())
            .customerEmail(order.getCustomerEmail())
            .storeId(order.getStoreId())
            .status(order.getStatus() != null ? order.getStatus().name() : null)
            .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
            .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING")
            .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
            .paymentTransactionId(order.getPaymentTransactionId())
            .priority(order.getPriority() != null ? order.getPriority().name() : "NORMAL")
            .subtotal(order.getSubtotal())
            .deliveryFee(order.getDeliveryFee())
            .tax(order.getTax())
            .total(order.getTotal())
            .specialInstructions(order.getSpecialInstructions())
            .tableNumber(order.getTableNumber())
            .guestCount(order.getGuestCount())
            .assignedDriverId(order.getAssignedDriverId())
            .createdByStaffId(order.getCreatedByStaffId())
            .createdByStaffName(order.getCreatedByStaffName())
            .preparationTime(order.getPreparationTime())
            .estimatedDeliveryTime(toOdt(order.getEstimatedDeliveryTime()))
            .deliveryAddress(deliveryAddressJson)
            .deliveryOtp(order.getDeliveryOtp())
            .deliveryProofType(order.getDeliveryProofType())
            .cancellationReason(order.getCancellationReason())
            .receivedAt(toOdt(order.getReceivedAt()))
            .preparingStartedAt(toOdt(order.getPreparingStartedAt()))
            .readyAt(toOdt(order.getReadyAt()))
            .dispatchedAt(toOdt(order.getDispatchedAt()))
            .deliveredAt(toOdt(order.getDeliveredAt()))
            .cancelledAt(toOdt(order.getCancelledAt()))
            .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().atZone(IST).toOffsetDateTime() : OffsetDateTime.now(IST))
            .vatCountryCode(order.getVatCountryCode())
            .totalNetAmount(order.getTotalNetAmount())
            .totalVatAmount(order.getTotalVatAmount())
            .totalGrossAmount(order.getTotalGrossAmount())
            .vatBreakdown(vatBreakdownJson)
            .build();

        // Map line items
        if (order.getItems() != null) {
            entity.setItems(orderItemSyncService.buildItemEntities(order.getItems(), entity));
        }

        return entity;
    }

    private void updateOrderJpaEntityFields(OrderJpaEntity pgOrder, Order order) {
        pgOrder.setStatus(order.getStatus() != null ? order.getStatus().name() : pgOrder.getStatus());
        pgOrder.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : pgOrder.getPaymentStatus());
        pgOrder.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : pgOrder.getPaymentMethod());
        pgOrder.setPaymentTransactionId(order.getPaymentTransactionId());
        pgOrder.setPriority(order.getPriority() != null ? order.getPriority().name() : pgOrder.getPriority());
        pgOrder.setAssignedDriverId(order.getAssignedDriverId());
        pgOrder.setTableNumber(order.getTableNumber());
        pgOrder.setGuestCount(order.getGuestCount());
        pgOrder.setSubtotal(order.getSubtotal());
        pgOrder.setDeliveryFee(order.getDeliveryFee());
        pgOrder.setTax(order.getTax());
        pgOrder.setTotal(order.getTotal());
        pgOrder.setPreparationTime(order.getPreparationTime());
        pgOrder.setDeliveryOtp(order.getDeliveryOtp());
        pgOrder.setDeliveryProofType(order.getDeliveryProofType());
        pgOrder.setCancellationReason(order.getCancellationReason());
        pgOrder.setReceivedAt(toOdt(order.getReceivedAt()));
        pgOrder.setPreparingStartedAt(toOdt(order.getPreparingStartedAt()));
        pgOrder.setReadyAt(toOdt(order.getReadyAt()));
        pgOrder.setDispatchedAt(toOdt(order.getDispatchedAt()));
        pgOrder.setDeliveredAt(toOdt(order.getDeliveredAt()));
        pgOrder.setCancelledAt(toOdt(order.getCancelledAt()));
    }

    // ==================== PROOF OF DELIVERY METHODS (DELIV-002) ====================

    /**
     * Set delivery OTP for an order
     * Called when order is dispatched
     */
    @Transactional
    public Order setDeliveryOtp(String orderId, String otp, LocalDateTime generatedAt, LocalDateTime expiresAt) {
        Order order = getOrderById(orderId);

        order.setDeliveryOtp(otp);
        order.setDeliveryOtpGeneratedAt(generatedAt);
        order.setDeliveryOtpExpiresAt(expiresAt);

        Order savedOrder = orderRepository.save(order);
        log.info("Delivery OTP set for order {}. Expires at {}", orderId, expiresAt);

        // Phase 2 dual-write: sync OTP to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(savedOrder.getId()).ifPresentOrElse(
                pgOrder -> { pgOrder.setDeliveryOtp(otp); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for setDeliveryOtp orderId={}", orderId)
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for setDeliveryOtp orderId={}: {}", orderId, e.getMessage());
        }

        // Send OTP to customer via notification service
        customerNotificationService.sendDeliveryOtpNotification(savedOrder, otp);

        return savedOrder;
    }

    /**
     * Set delivery proof details (photo, signature, notes)
     */
    @Transactional
    public Order setDeliveryProof(String orderId, String proofType, String photoUrl, String signatureUrl, String notes) {
        Order order = getOrderById(orderId);

        order.setDeliveryProofType(proofType);
        if (photoUrl != null) {
            order.setDeliveryPhotoUrl(photoUrl);
        }
        if (signatureUrl != null) {
            order.setDeliverySignatureUrl(signatureUrl);
        }
        if (notes != null) {
            order.setDeliveryNotes(notes);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Delivery proof set for order {}. Type: {}", orderId, proofType);

        // Phase 2 dual-write: sync proof type to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(savedOrder.getId()).ifPresentOrElse(
                pgOrder -> {
                        pgOrder.setDeliveryProofType(proofType);
                        // Store whichever proof URL is present (photo takes precedence; fall back to signature)
                        String proofUrl = photoUrl != null ? photoUrl : signatureUrl;
                        if (proofUrl != null) pgOrder.setDeliveryProofUrl(proofUrl);
                        orderJpaRepository.save(pgOrder);
                    },
                () -> log.warn("PG dual-write: no PG row found for setDeliveryProof orderId={}", orderId)
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for setDeliveryProof orderId={}: {}", orderId, e.getMessage());
        }

        return savedOrder;
    }

    /**
     * Mark order as delivered with proof
     */
    @Transactional
    public Order markOrderDelivered(String orderId, LocalDateTime deliveredAt, String proofType) {
        Order order = getOrderById(orderId);

        if (order.getStatus() == OrderStatus.DELIVERED) {
            log.warn("Order {} is already DELIVERED — ignoring duplicate markOrderDelivered call", orderId);
            return order;
        }
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY && order.getStatus() != OrderStatus.DISPATCHED) {
            throw new IllegalStateException("Cannot mark order " + orderId + " as delivered — current status is " + order.getStatus());
        }

        // Update status to delivered
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(deliveredAt);
        order.setCompletedAt(deliveredAt);
        order.setDeliveryProofType(proofType);

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} marked as delivered at {} using {} verification", orderId, deliveredAt, proofType);

        // Phase 2 dual-write: sync delivered status + proof type to PostgreSQL (non-blocking)
        try {
            orderJpaRepository.findByMongoId(savedOrder.getId()).ifPresentOrElse(
                pgOrder -> { updateOrderJpaEntityFields(pgOrder, savedOrder); orderJpaRepository.save(pgOrder); },
                () -> log.warn("PG dual-write: no PG row found for markOrderDelivered orderId={}", orderId)
            );
        } catch (Exception e) {
            log.warn("PG dual-write failed for markOrderDelivered orderId={}: {}", orderId, e.getMessage());
        }

        // Publish status changed event to RabbitMQ
        try {
            orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
                savedOrder.getId(), savedOrder.getCustomerId(),
                OrderStatus.DISPATCHED.toString(), OrderStatus.DELIVERED.toString(),
                savedOrder.getStoreId()));
        } catch (Exception e) {
            log.warn("Failed to publish delivered event for {}: {}", orderId, e.getMessage());
        }

        // Send delivery confirmation notification
        customerNotificationService.sendOrderStatusNotification(savedOrder, OrderStatus.DELIVERED);

        // Broadcast WebSocket update
        webSocketController.sendKitchenQueueUpdate(savedOrder.getStoreId(), savedOrder);

        return savedOrder;
    }
}
