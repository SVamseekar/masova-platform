package com.MaSoVa.commerce.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "order_postgres_outbox")
@CompoundIndexes({
        // Supports OrderPostgresOutboxRepository's drain query (findTop50...OrderByCreatedAtAsc),
        // which runs on a schedule forever — without this it collection-scans every cycle.
        @CompoundIndex(name = "pending_drain_order",
                def = "{'resolvedAt': 1, 'deadLettered': 1, 'createdAt': 1}")
})
public class OrderPostgresOutbox {

    @Id
    private String id;

    @Indexed
    private String orderId;

    private String orderNumber;

    private String operation;

    private String lastError;

    private LocalDateTime createdAt;

    private int attempts;

    private LocalDateTime resolvedAt;

    private boolean deadLettered;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public boolean isDeadLettered() {
        return deadLettered;
    }

    public void setDeadLettered(boolean deadLettered) {
        this.deadLettered = deadLettered;
    }
}
