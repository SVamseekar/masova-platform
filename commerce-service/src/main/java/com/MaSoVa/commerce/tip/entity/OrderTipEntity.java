package com.MaSoVa.commerce.tip.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "order_tips",
    schema = "commerce_schema",
    uniqueConstraints = @UniqueConstraint(name = "uq_tips_order_id", columnNames = "order_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "store_id", nullable = false, length = 36)
    private String storeId;

    @Column(name = "amount_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountInr;

    /** DIRECT = named recipient, POOL = distributed equally among all staff who worked that week */
    @Column(name = "tip_type", nullable = false, length = 10)
    private String tipType;

    @Column(name = "recipient_staff_id", length = 36)
    private String recipientStaffId;

    @Builder.Default
    @Column(name = "distributed", nullable = false)
    private Boolean distributed = false;

    @Column(name = "distributed_at")
    private OffsetDateTime distributedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** Soft delete — financial records are never physically deleted */
    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
    }
}
