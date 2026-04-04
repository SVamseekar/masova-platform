package com.MaSoVa.commerce.order.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * PostgreSQL JPA entity for the order_items table (Phase 2 dual-write).
 * Maps to commerce_schema.order_items.
 * Line items are immutable after insert — no @Version needed.
 *
 * NOTE: OrderItem.java uses Double for price; this entity uses BigDecimal
 * (DECIMAL(10,2) in SQL requires BigDecimal for type safety in financial data).
 * The dual-write mapper converts Double → BigDecimal via BigDecimal.valueOf().
 */
@Entity
@Table(name = "order_items", schema = "commerce_schema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemJpaEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderJpaEntity order;

    @Column(name = "menu_item_id", nullable = false, length = 36)
    private String menuItemId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /** Price per unit. Double from OrderItem is converted to BigDecimal on dual-write. */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "variant", length = 255)
    private String variant;

    /** JSON-encoded List<String> customizations from MongoDB OrderItem */
    @Column(name = "customizations", columnDefinition = "TEXT")
    private String customizations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

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
