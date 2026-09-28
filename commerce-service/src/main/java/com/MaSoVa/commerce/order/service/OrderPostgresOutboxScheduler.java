package com.MaSoVa.commerce.order.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/** Runs the Postgres outbox projector. Disabled in tests, which call the projector directly. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "commerce.postgres-outbox.projector.enabled", havingValue = "true", matchIfMissing = true)
public class OrderPostgresOutboxScheduler {

    private final OrderPostgresOutboxProjector projector;

    public OrderPostgresOutboxScheduler(OrderPostgresOutboxProjector projector) {
        this.projector = projector;
    }

    @Scheduled(fixedDelayString = "${commerce.postgres-outbox.drain-interval-ms:30000}")
    public void drain() {
        projector.drain();
    }
}
