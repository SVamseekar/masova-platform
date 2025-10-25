package com.MaSoVa.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private Integer actualPreparationTime; // Total time from RECEIVED to BAKED
    private Integer actualOvenTime; // Time spent in oven stage

    // Make-table workflow
    private String assignedMakeTableStation; // PIZZA, SANDWICH, GRILL, FRY, DESSERT
    private String assignedKitchenStaffId;
    private String assignedKitchenStaffName;
    private LocalDateTime assignedToKitchenAt;

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
