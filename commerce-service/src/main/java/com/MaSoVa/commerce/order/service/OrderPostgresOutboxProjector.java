package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.OrderPostgresOutbox;
import com.MaSoVa.commerce.order.repository.OrderPostgresOutboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Drains {@link OrderPostgresOutbox}: entries recorded when the in-request best-effort
 * PostgreSQL projection (OrderService.createOrder/syncToPostgres) failed. MongoDB is the
 * system of record (D08); this repairs the Postgres projection by re-deriving it from the
 * order's CURRENT Mongo state, which makes replay naturally idempotent regardless of
 * ordering or duplicate entries.
 *
 * A row that keeps failing is retried up to {@code maxAttempts} times, then dead-lettered
 * (stops being drained, logged at ERROR) rather than retried forever — a permanently broken
 * row (e.g. a malformed order) would otherwise poison every drain cycle indefinitely.
 */
@Component
public class OrderPostgresOutboxProjector {

    private static final Logger log = LoggerFactory.getLogger(OrderPostgresOutboxProjector.class);

    private final OrderPostgresOutboxRepository outboxRepository;
    private final OrderService orderService;
    private final int maxAttempts;

    public OrderPostgresOutboxProjector(OrderPostgresOutboxRepository outboxRepository,
                                         OrderService orderService,
                                         ObjectProvider<MeterRegistry> meterRegistry,
                                         @Value("${commerce.postgres-outbox.max-attempts:10}") int maxAttempts) {
        this.outboxRepository = outboxRepository;
        this.orderService = orderService;
        this.maxAttempts = maxAttempts;
        MeterRegistry registry = meterRegistry.getIfAvailable();
        if (registry != null) {
            Gauge.builder("commerce.postgres_outbox.pending", outboxRepository,
                            OrderPostgresOutboxRepository::countByResolvedAtIsNullAndDeadLetteredFalse)
                    .description("Order Postgres outbox entries still pending projection")
                    .register(registry);
        }
    }

    /** Drains up to one batch of pending outbox entries, oldest first. */
    public void drain() {
        List<OrderPostgresOutbox> pending;
        try {
            pending = outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc();
        } catch (Exception e) {
            log.error("Postgres outbox drain cycle aborted before processing any entries: {}", e.getMessage(), e);
            return;
        }
        int processed = 0;
        for (OrderPostgresOutbox entry : pending) {
            try {
                orderService.reprojectToPostgres(entry.getOrderId());
                entry.setResolvedAt(LocalDateTime.now());
                entry.setLastError(null);
            } catch (Exception e) {
                int attempts = entry.getAttempts() + 1;
                entry.setAttempts(attempts);
                entry.setLastError(e.getMessage() != null ? e.getMessage() : e.getClass().getName());
                if (attempts >= maxAttempts) {
                    entry.setDeadLettered(true);
                    log.error("Giving up on projecting order {} to Postgres after {} attempts ({}): {}",
                            entry.getOrderId(), attempts, e.getClass().getSimpleName(), e.getMessage(), e);
                } else {
                    log.warn("Projection retry {} failed for order {} ({}): {}",
                            attempts, entry.getOrderId(), e.getClass().getSimpleName(), e.getMessage());
                }
            }
            try {
                outboxRepository.save(entry);
                processed++;
            } catch (Exception saveEx) {
                // Don't let a bookkeeping-write failure abort the rest of the batch — the oldest
                // entry's save failing forever would otherwise block every entry behind it.
                log.error("Failed to persist outbox bookkeeping for order {} (outbox row {}): {}",
                        entry.getOrderId(), entry.getId(), saveEx.getMessage(), saveEx);
            }
        }
        if (processed < pending.size()) {
            log.warn("Postgres outbox drain cycle processed {}/{} entries; see prior errors for the rest",
                    processed, pending.size());
        }
    }
}
