package com.MaSoVa.payment.messaging;

import com.MaSoVa.payment.entity.OrderPaymentSync;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderPaymentStatusEvent;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Polling publisher for the outbox embedded in Transaction.orderSync.
 * Leases one due entry at a time with findAndModify, so several instances can run it.
 * Delivery is at least once; commerce applies the status idempotently.
 *
 * Lease/ack/retry bookkeeping writes go to the raw collection so they do not bump
 * Transaction's @Version: a concurrent full save elsewhere (webhook, reconcile, GDPR)
 * must not fail because of relay housekeeping. If such a save overwrites the bookkeeping,
 * the entry is at worst re-sent, which the consumer absorbs.
 */
@Component
public class OrderPaymentSyncRelay {

    private static final Logger log = LoggerFactory.getLogger(OrderPaymentSyncRelay.class);

    private static final String COLLECTION = "transactions";
    private static final Duration LEASE = Duration.ofSeconds(30);
    private static final Duration MAX_BACKOFF = Duration.ofMinutes(5);

    private final MongoTemplate mongoTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectProvider<MeterRegistry> meterRegistry;
    private final int maxAttempts;
    private final int batchSize;
    private final long confirmTimeoutMs;
    private final Duration staleAfter;

    public OrderPaymentSyncRelay(MongoTemplate mongoTemplate,
                                 RabbitTemplate rabbitTemplate,
                                 ObjectProvider<MeterRegistry> meterRegistry,
                                 @Value("${payment.order-sync.max-attempts:10}") int maxAttempts,
                                 @Value("${payment.order-sync.batch-size:50}") int batchSize,
                                 @Value("${payment.order-sync.confirm-timeout-ms:5000}") long confirmTimeoutMs,
                                 @Value("${payment.order-sync.stale-after-seconds:60}") long staleAfterSeconds) {
        this.mongoTemplate = mongoTemplate;
        this.rabbitTemplate = rabbitTemplate;
        this.meterRegistry = meterRegistry;
        this.maxAttempts = maxAttempts;
        this.batchSize = batchSize;
        this.confirmTimeoutMs = confirmTimeoutMs;
        this.staleAfter = Duration.ofSeconds(staleAfterSeconds);
        // Measured on scrape, so a stopped or disabled relay still shows up as a growing backlog.
        MeterRegistry registry = meterRegistry.getIfAvailable();
        if (registry != null) {
            Gauge.builder("payment.order_sync.pending.stale", this, OrderPaymentSyncRelay::countStalePending)
                    .description("Order payment status events still PENDING after the stale threshold")
                    .register(registry);
        }
    }

    double countStalePending() {
        return mongoTemplate.count(Query.query(Criteria.where("orderSync.status").is(OrderPaymentSync.Status.PENDING.name())
                .and("orderSync.createdAt").lt(Instant.now().minus(staleAfter))), COLLECTION);
    }

    /**
     * Replace the order status still to publish, for a transaction saved earlier.
     * A newer status supersedes an unsent older one.
     */
    public void requestOrderPaymentStatus(String transactionId, String paymentStatus) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(transactionId)),
                new Update().set("orderSync", OrderPaymentSync.pending(paymentStatus)),
                Transaction.class);
    }

    /** Publishes due entries. Returns how many were confirmed by the broker. */
    public int relayDue() {
        int published = 0;
        for (int i = 0; i < batchSize; i++) {
            Document raw = leaseNextDue();
            if (raw == null) {
                break;
            }
            Transaction leased;
            try {
                leased = mongoTemplate.getConverter().read(Transaction.class, raw);
            } catch (RuntimeException e) {
                markUnreadableDead(raw.get("_id"), e);
                continue;
            }
            OrderPaymentSync sync = leased.getOrderSync();
            try {
                publish(leased, sync);
            } catch (Exception e) {
                markRetry(leased.getId(), sync, e);
                continue;
            }
            published++;
            try {
                markSent(leased.getId(), sync.getEventId());
            } catch (RuntimeException e) {
                // Delivered; the lease expires and the event is re-sent, which the consumer absorbs.
                log.error("Published order payment status for transaction {} but could not mark it SENT",
                        leased.getId(), e);
            }
        }
        return published;
    }

    private Document leaseNextDue() {
        Instant now = Instant.now();
        Query due = Query.query(Criteria.where("orderSync.status").is(OrderPaymentSync.Status.PENDING.name())
                .and("orderSync.nextAttemptAt").lte(now)
                .orOperator(Criteria.where("orderSync.leaseUntil").exists(false),
                        Criteria.where("orderSync.leaseUntil").is(null),
                        Criteria.where("orderSync.leaseUntil").lte(now)));
        return mongoTemplate.findAndModify(due,
                new Update().set("orderSync.leaseUntil", now.plus(LEASE)),
                FindAndModifyOptions.options().returnNew(true),
                Document.class, COLLECTION);
    }

    private void publish(Transaction transaction, OrderPaymentSync sync) throws Exception {
        OrderPaymentStatusEvent event = new OrderPaymentStatusEvent(
                sync.getEventId(), transaction.getOrderId(), transaction.getId(), sync.getPaymentStatus());
        CorrelationData correlation = new CorrelationData(sync.getEventId());
        rabbitTemplate.convertAndSend(MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE,
                MaSoVaRabbitMQConfig.ORDER_PAYMENT_STATUS_KEY, event, correlation);
        CorrelationData.Confirm confirm = correlation.getFuture().get(confirmTimeoutMs, TimeUnit.MILLISECONDS);
        if (!confirm.isAck()) {
            throw new IllegalStateException("Broker nack: " + confirm.getReason());
        }
        if (correlation.getReturned() != null) {
            throw new IllegalStateException("Unroutable: " + correlation.getReturned().getReplyText());
        }
    }

    /** Marks SENT only if the entry is still the one that was published. */
    public void markSent(String transactionId, String eventId) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(transactionId).and("orderSync.eventId").is(eventId)),
                new Update().set("orderSync.status", OrderPaymentSync.Status.SENT.name())
                        .unset("orderSync.leaseUntil")
                        .unset("orderSync.lastError"),
                COLLECTION);
    }

    private void markUnreadableDead(Object id, RuntimeException error) {
        log.error("Order payment status outbox entry on transaction {} cannot be read; marking DEAD", id, error);
        try {
            mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(id)),
                    new Update().set("orderSync.status", OrderPaymentSync.Status.DEAD.name())
                            .set("orderSync.lastError", "unreadable: " + error.getMessage())
                            .unset("orderSync.leaseUntil"),
                    COLLECTION);
        } catch (RuntimeException markError) {
            log.error("Could not mark unreadable outbox entry {} DEAD", id, markError);
        }
        countDead();
    }

    private void countDead() {
        MeterRegistry registry = meterRegistry.getIfAvailable();
        if (registry != null) {
            registry.counter("payment.order_sync.dead").increment();
        }
    }

    private void markRetry(String transactionId, OrderPaymentSync sync, Exception error) {
        log.warn("Order payment status publish failed for transaction {}: {}", transactionId, error.getMessage());
        int attempts = sync.getAttempts() + 1;
        boolean dead = attempts >= maxAttempts;
        Update update = new Update()
                .set("orderSync.attempts", attempts)
                .set("orderSync.lastError", String.valueOf(error.getMessage()))
                .set("orderSync.nextAttemptAt", Instant.now().plus(backoff(attempts)))
                .unset("orderSync.leaseUntil");
        if (dead) {
            update.set("orderSync.status", OrderPaymentSync.Status.DEAD.name());
        }
        try {
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(transactionId).and("orderSync.eventId").is(sync.getEventId())),
                    update, COLLECTION);
        } catch (RuntimeException recordError) {
            // The lease expires and the entry is retried; keep both causes in the log.
            log.error("Could not record retry for transaction {} after publish error", transactionId, recordError);
            recordError.addSuppressed(error);
            return;
        }
        if (dead) {
            log.error("Order payment status {} for transaction {} is DEAD after {} attempts; order will not update",
                    sync.getPaymentStatus(), transactionId, attempts, error);
            countDead();
        }
    }

    static Duration backoff(int attempts) {
        long seconds = 1L << Math.min(attempts, 20);
        Duration delay = Duration.ofSeconds(seconds);
        return delay.compareTo(MAX_BACKOFF) > 0 ? MAX_BACKOFF : delay;
    }
}
