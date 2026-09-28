package com.MaSoVa.payment.entity;

import java.time.Instant;
import java.util.UUID;

/**
 * Outbox entry embedded in a Transaction: the payment status its order should show.
 * It is written in the same single-document save as the transaction status, so the two
 * cannot diverge. OrderPaymentSyncRelay publishes it and marks it SENT.
 */
public class OrderPaymentSync {

    public enum Status { PENDING, SENT, DEAD }

    private String eventId;
    private String paymentStatus;
    private Status status;
    private int attempts;
    private Instant nextAttemptAt;
    private Instant leaseUntil;
    private String lastError;
    private Instant createdAt;

    public static OrderPaymentSync pending(String paymentStatus) {
        OrderPaymentSync sync = new OrderPaymentSync();
        sync.eventId = UUID.randomUUID().toString();
        sync.paymentStatus = paymentStatus;
        sync.status = Status.PENDING;
        sync.attempts = 0;
        sync.createdAt = Instant.now();
        sync.nextAttemptAt = sync.createdAt;
        return sync;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public void setNextAttemptAt(Instant nextAttemptAt) { this.nextAttemptAt = nextAttemptAt; }
    public Instant getLeaseUntil() { return leaseUntil; }
    public void setLeaseUntil(Instant leaseUntil) { this.leaseUntil = leaseUntil; }
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
