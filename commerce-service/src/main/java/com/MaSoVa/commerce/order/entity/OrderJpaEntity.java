package com.MaSoVa.commerce.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * PostgreSQL JPA entity for the orders table (Phase 2 dual-write).
 * MongoDB remains the primary read source during dual-write period.
 * Schema: commerce_schema
 *
 * updated_at is managed by a DB trigger (not @Version), because orders use a
 * separate BIGINT version column for optimistic locking. Using @Version on
 * updated_at would conflict with the trigger.
 */
@Entity
@Table(
    name = "orders",
    schema = "commerce_schema",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_orders_order_number", columnNames = "order_number"),
        @UniqueConstraint(name = "uq_orders_mongo_id",     columnNames = "mongo_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderJpaEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;  // Application-assigned from MongoDB ObjectId / UUID — set before save

    /** MongoDB ObjectId — used to correlate records during migration tracking */
    @Column(name = "mongo_id", length = 36, unique = true)
    private String mongoId;

    /**
     * Optimistic locking version (separate from updated_at).
     * Hibernate manages this automatically — do NOT set manually.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "customer_id", length = 36)
    private String customerId;

    @Column(name = "customer_name", nullable = false, length = 255)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "store_id", nullable = false, length = 36)
    private String storeId;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType;

    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 50)
    private String paymentStatus = "PENDING";

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_transaction_id", length = 255)
    private String paymentTransactionId;

    @Builder.Default
    @Column(name = "priority", length = 20)
    private String priority = "NORMAL";

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "tax", precision = 10, scale = 2)
    private BigDecimal tax;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    // Global-2: EU VAT columns — null for India orders
    @Column(name = "vat_country_code", length = 2)
    private String vatCountryCode;

    @Column(name = "total_net_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalNetAmount;

    @Column(name = "total_vat_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalVatAmount;

    @Column(name = "total_gross_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalGrossAmount;

    @Column(name = "vat_breakdown", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String vatBreakdown;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    /** DINE_IN orders only */
    @Column(name = "table_number", length = 20)
    private String tableNumber;

    /** DINE_IN orders only */
    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "assigned_driver_id", length = 36)
    private String assignedDriverId;

    @Column(name = "created_by_staff_id", length = 36)
    private String createdByStaffId;

    @Column(name = "created_by_staff_name", length = 255)
    private String createdByStaffName;

    @Column(name = "preparation_time")
    private Integer preparationTime;

    @Column(name = "estimated_delivery_time")
    private OffsetDateTime estimatedDeliveryTime;

    /**
     * DeliveryAddress stored as JSONB. Jackson serialises the object to JSON string.
     * Mapped via @JdbcTypeCode(SqlTypes.JSON) — Hibernate 6 (Spring Boot 3) requirement.
     */
    @Column(name = "delivery_address", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String deliveryAddress;

    @Column(name = "delivery_otp", length = 10)
    private String deliveryOtp;

    @Column(name = "delivery_proof_type", length = 50)
    private String deliveryProofType;

    @Column(name = "delivery_proof_url", columnDefinition = "TEXT")
    private String deliveryProofUrl;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // Kitchen workflow timestamps
    @Column(name = "received_at")
    private OffsetDateTime receivedAt;

    @Column(name = "preparing_started_at")
    private OffsetDateTime preparingStartedAt;

    @Column(name = "ready_at")
    private OffsetDateTime readyAt;

    @Column(name = "dispatched_at")
    private OffsetDateTime dispatchedAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    /** Soft-delete timestamp. Financial data is never physically deleted. */
    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /**
     * Managed by DB trigger (update_orders_updated_at). Do NOT set manually.
     * NOTE: This field is null in the Java object immediately after save() — it is only
     * populated after a re-fetch from the database. The DB trigger sets it on INSERT/UPDATE.
     * Service code must not rely on this field being non-null post-save without a fresh load.
     */
    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    /**
     * Order line items — written as part of the dual-write via CascadeType.ALL.
     * orphanRemoval=false: line items are immutable; if the collection is replaced on the
     * Java side, the old rows must NOT be deleted (financial audit trail).
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<OrderItemJpaEntity> items;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now(IST);
        }
    }
}
