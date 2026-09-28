package com.MaSoVa.payment.messaging;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/** Runs the order payment status relay. Disabled in tests, which call the relay directly. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "payment.order-sync.relay.enabled", havingValue = "true", matchIfMissing = true)
public class OrderPaymentSyncScheduler {

    private final OrderPaymentSyncRelay relay;

    public OrderPaymentSyncScheduler(OrderPaymentSyncRelay relay) {
        this.relay = relay;
    }

    @Scheduled(fixedDelayString = "${payment.order-sync.relay.delay-ms:2000}")
    public void relay() {
        relay.relayDue();
    }
}
