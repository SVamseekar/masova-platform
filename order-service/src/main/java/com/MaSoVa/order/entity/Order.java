package com.MaSoVa.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    @Indexed(unique = true)
    private String orderNumber;

    private String customerId;
    private String customerName;
    private String customerPhone;

    @Indexed
    private String storeId;

    private List<OrderItem> items;

    private Double subtotal;
    private Double deliveryFee;
    private Double tax;
    private Double total;

    @Indexed
    private OrderStatus status;

    private OrderType orderType;

    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String paymentTransactionId;

    private Priority priority;

    private Integer preparationTime;
    private LocalDateTime estimatedDeliveryTime;

    private DeliveryAddress deliveryAddress;

    private String assignedDriverId;

    private String specialInstructions;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;
    private String cancellationReason;

    // Kitchen workflow timestamps
    private LocalDateTime receivedAt;
    private LocalDateTime preparingStartedAt;
    private LocalDateTime ovenStartedAt;
    private LocalDateTime bakedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    // Quality checkpoints
    private List<QualityCheckpoint> qualityCheckpoints;

    // Actual preparation time tracking (in minutes)
    private Integer actualPreparationTime;
    private Integer actualOvenTime;

    // Make-table workflow
    private String assignedMakeTableStation;
    private String assignedKitchenStaffId;
    private String assignedKitchenStaffName;
    private LocalDateTime assignedToKitchenAt;

    // Constructors
    public Order() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(Double deliveryFee) { this.deliveryFee = deliveryFee; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Integer getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Integer preparationTime) { this.preparationTime = preparationTime; }

    public LocalDateTime getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) { this.estimatedDeliveryTime = estimatedDeliveryTime; }

    public DeliveryAddress getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(DeliveryAddress deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(String assignedDriverId) { this.assignedDriverId = assignedDriverId; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public LocalDateTime getPreparingStartedAt() { return preparingStartedAt; }
    public void setPreparingStartedAt(LocalDateTime preparingStartedAt) { this.preparingStartedAt = preparingStartedAt; }

    public LocalDateTime getOvenStartedAt() { return ovenStartedAt; }
    public void setOvenStartedAt(LocalDateTime ovenStartedAt) { this.ovenStartedAt = ovenStartedAt; }

    public LocalDateTime getBakedAt() { return bakedAt; }
    public void setBakedAt(LocalDateTime bakedAt) { this.bakedAt = bakedAt; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public List<QualityCheckpoint> getQualityCheckpoints() { return qualityCheckpoints; }
    public void setQualityCheckpoints(List<QualityCheckpoint> qualityCheckpoints) { this.qualityCheckpoints = qualityCheckpoints; }

    public Integer getActualPreparationTime() { return actualPreparationTime; }
    public void setActualPreparationTime(Integer actualPreparationTime) { this.actualPreparationTime = actualPreparationTime; }

    public Integer getActualOvenTime() { return actualOvenTime; }
    public void setActualOvenTime(Integer actualOvenTime) { this.actualOvenTime = actualOvenTime; }

    public String getAssignedMakeTableStation() { return assignedMakeTableStation; }
    public void setAssignedMakeTableStation(String assignedMakeTableStation) { this.assignedMakeTableStation = assignedMakeTableStation; }

    public String getAssignedKitchenStaffId() { return assignedKitchenStaffId; }
    public void setAssignedKitchenStaffId(String assignedKitchenStaffId) { this.assignedKitchenStaffId = assignedKitchenStaffId; }

    public String getAssignedKitchenStaffName() { return assignedKitchenStaffName; }
    public void setAssignedKitchenStaffName(String assignedKitchenStaffName) { this.assignedKitchenStaffName = assignedKitchenStaffName; }

    public LocalDateTime getAssignedToKitchenAt() { return assignedToKitchenAt; }
    public void setAssignedToKitchenAt(LocalDateTime assignedToKitchenAt) { this.assignedToKitchenAt = assignedToKitchenAt; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Order order = new Order();

        public Builder id(String id) { order.id = id; return this; }
        public Builder orderNumber(String orderNumber) { order.orderNumber = orderNumber; return this; }
        public Builder customerId(String customerId) { order.customerId = customerId; return this; }
        public Builder customerName(String customerName) { order.customerName = customerName; return this; }
        public Builder customerPhone(String customerPhone) { order.customerPhone = customerPhone; return this; }
        public Builder storeId(String storeId) { order.storeId = storeId; return this; }
        public Builder items(List<OrderItem> items) { order.items = items; return this; }
        public Builder subtotal(Double subtotal) { order.subtotal = subtotal; return this; }
        public Builder deliveryFee(Double deliveryFee) { order.deliveryFee = deliveryFee; return this; }
        public Builder tax(Double tax) { order.tax = tax; return this; }
        public Builder total(Double total) { order.total = total; return this; }
        public Builder status(OrderStatus status) { order.status = status; return this; }
        public Builder orderType(OrderType orderType) { order.orderType = orderType; return this; }
        public Builder paymentStatus(PaymentStatus paymentStatus) { order.paymentStatus = paymentStatus; return this; }
        public Builder paymentMethod(PaymentMethod paymentMethod) { order.paymentMethod = paymentMethod; return this; }
        public Builder priority(Priority priority) { order.priority = priority; return this; }
        public Builder preparationTime(Integer preparationTime) { order.preparationTime = preparationTime; return this; }
        public Builder estimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) { order.estimatedDeliveryTime = estimatedDeliveryTime; return this; }
        public Builder deliveryAddress(DeliveryAddress deliveryAddress) { order.deliveryAddress = deliveryAddress; return this; }
        public Builder specialInstructions(String specialInstructions) { order.specialInstructions = specialInstructions; return this; }
        public Builder receivedAt(LocalDateTime receivedAt) { order.receivedAt = receivedAt; return this; }
        public Builder qualityCheckpoints(List<QualityCheckpoint> qualityCheckpoints) { order.qualityCheckpoints = qualityCheckpoints; return this; }

        public Order build() { return order; }
    }

    // Enums
    public enum OrderStatus {
        RECEIVED,
        PREPARING,
        OVEN,
        BAKED,
        DISPATCHED,
        DELIVERED,
        CANCELLED
    }

    public enum OrderType {
        DINE_IN,
        TAKEAWAY,
        DELIVERY
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }

    public enum PaymentMethod {
        CASH,
        CARD,
        UPI,
        WALLET
    }

    public enum Priority {
        NORMAL,
        URGENT
    }
}
