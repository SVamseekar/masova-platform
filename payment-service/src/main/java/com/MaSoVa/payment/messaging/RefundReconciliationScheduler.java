package com.MaSoVa.payment.messaging;

import com.MaSoVa.payment.service.RefundReconciliationRelay;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/** Runs the refund reconciliation relay. Disabled in tests, which call the relay directly. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "payment.refund-reconcile.enabled", havingValue = "true", matchIfMissing = true)
public class RefundReconciliationScheduler {

    private final RefundReconciliationRelay relay;

    public RefundReconciliationScheduler(RefundReconciliationRelay relay) {
        this.relay = relay;
    }

    @Scheduled(fixedDelayString = "${payment.refund-reconcile.delay-ms:60000}")
    public void reconcile() {
        relay.reconcileDue();
    }
}
