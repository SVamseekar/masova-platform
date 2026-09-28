package com.MaSoVa.payment.service;

import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Reconciles refunds stuck in PROCESSING — either because the gateway's status webhook was
 * never delivered (Razorpay refunds settle asynchronously, per {@code RefundService}), or
 * because a prior gateway call timed out with the outcome left genuinely ambiguous.
 *
 * These are two different situations:
 * <ul>
 *   <li>A refund with a real gateway refund id (the normal case): its status can be looked up
 *       directly via {@link PaymentGateway#fetchRefundStatus} and applied through the same
 *       {@code RefundService.updateRefundStatus} a webhook would use — this is what a delayed
 *       or dropped webhook needs.</li>
 *   <li>A refund still holding its local placeholder id ({@code claim_...}, set in
 *       {@code RefundService.executeRefund} before the gateway call and never replaced because
 *       the call's outcome was never confirmed): there is no gateway-side id to query, and
 *       Razorpay refund creation is not wired with an idempotency key today, so a blind retry
 *       risks a duplicate refund. This case is deliberately NOT auto-resolved — it is logged
 *       for manual investigation, the same "require a human for financial ambiguity" policy
 *       already used for refund approval (D15).</li>
 * </ul>
 */
@Component
public class RefundReconciliationRelay {

    private static final Logger log = LoggerFactory.getLogger(RefundReconciliationRelay.class);
    private static final String UNRESOLVED_CLAIM_PREFIX = "claim_";
    // An unconfirmed claim needs a human — escalate the log once it's been stuck this long,
    // rather than the same WARN repeating forever at the scheduler's poll cadence.
    private static final Duration ESCALATE_UNCONFIRMED_AFTER = Duration.ofHours(1);

    private final RefundRepository refundRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentGatewayResolver paymentGatewayResolver;
    private final RefundService refundService;
    private final Duration staleAfter;
    private final int batchSize;

    public RefundReconciliationRelay(RefundRepository refundRepository,
                                      TransactionRepository transactionRepository,
                                      PaymentGatewayResolver paymentGatewayResolver,
                                      RefundService refundService,
                                      ObjectProvider<MeterRegistry> meterRegistry,
                                      @Value("${payment.refund-reconcile.stale-after-seconds:300}") long staleAfterSeconds,
                                      @Value("${payment.refund-reconcile.batch-size:50}") int batchSize) {
        this.refundRepository = refundRepository;
        this.transactionRepository = transactionRepository;
        this.paymentGatewayResolver = paymentGatewayResolver;
        this.refundService = refundService;
        this.staleAfter = Duration.ofSeconds(staleAfterSeconds);
        this.batchSize = batchSize;
        MeterRegistry registry = meterRegistry.getIfAvailable();
        if (registry != null) {
            Gauge.builder("payment.refund_reconcile.stuck", this, RefundReconciliationRelay::countStuck)
                    .description("Refunds stuck PROCESSING past the stale threshold")
                    .register(registry);
            // Separate from the general stuck count: these specifically need a human, since no
            // gateway-side id exists to safely auto-resolve them.
            Gauge.builder("payment.refund_reconcile.unconfirmed_claim", this,
                            RefundReconciliationRelay::countUnconfirmedClaims)
                    .description("Stuck refunds with no confirmed gateway refund id — needs manual reconciliation")
                    .register(registry);
        }
    }

    double countStuck() {
        return refundRepository.countByStatusAndUpdatedAtBefore(Refund.RefundStatus.PROCESSING, cutoff());
    }

    public double countUnconfirmedClaims() {
        return refundRepository.findByStatusAndUpdatedAtBefore(Refund.RefundStatus.PROCESSING, cutoff())
                .stream().filter(RefundReconciliationRelay::hasNoConfirmedGatewayId).count();
    }

    private LocalDateTime cutoff() {
        return LocalDateTime.now().minus(staleAfter);
    }

    /** Reconciles up to one batch of refunds stuck PROCESSING past the stale threshold. */
    public void reconcileDue() {
        List<Refund> stuck;
        try {
            stuck = refundRepository.findByStatusAndUpdatedAtBefore(Refund.RefundStatus.PROCESSING, cutoff());
        } catch (Exception e) {
            log.error("Refund reconciliation cycle aborted before processing any entries: {}", e.getMessage(), e);
            return;
        }
        int limit = Math.min(stuck.size(), batchSize);
        for (int i = 0; i < limit; i++) {
            Refund refund = stuck.get(i);
            try {
                reconcileOne(refund);
            } catch (Exception e) {
                log.warn("Refund reconciliation attempt failed for refund {} ({}): {}",
                        refund.getId(), e.getClass().getSimpleName(), e.getMessage());
            }
        }
    }

    private void reconcileOne(Refund refund) {
        if (hasNoConfirmedGatewayId(refund)) {
            logUnconfirmedClaim(refund);
            return;
        }
        Transaction transaction = transactionRepository.findById(refund.getTransactionId()).orElse(null);
        if (transaction == null) {
            log.warn("Refund {} references missing transaction {}; cannot reconcile",
                    refund.getId(), refund.getTransactionId());
            return;
        }
        String gatewayName = RefundService.resolveGatewayName(transaction);
        PaymentGateway gateway = paymentGatewayResolver.resolveByGatewayName(gatewayName);
        String gatewayStatus;
        try {
            gatewayStatus = gateway.fetchRefundStatus(refund.getRazorpayPaymentId(), refund.getRazorpayRefundId());
        } catch (Exception e) {
            throw new RuntimeException("Gateway lookup failed for refund " + refund.getId()
                    + " (gateway=" + gatewayName + "): " + e.getMessage(), e);
        }
        boolean applied = refundService.updateRefundStatus(refund.getRazorpayRefundId(), gatewayStatus);
        if (applied) {
            log.info("Reconciled refund {} via gateway lookup: gateway={}, status={}",
                    refund.getId(), gatewayName, gatewayStatus);
        } else {
            // The refund is left exactly as stuck as before this cycle — must not look like success.
            log.error("Refund {} gateway lookup returned an unrecognized status '{}' from {} — "
                            + "refund left unchanged, needs manual review",
                    refund.getId(), gatewayStatus, gatewayName);
        }
    }

    private void logUnconfirmedClaim(Refund refund) {
        boolean escalate = refund.getUpdatedAt() != null
                && Duration.between(refund.getUpdatedAt(), LocalDateTime.now()).compareTo(ESCALATE_UNCONFIRMED_AFTER) >= 0;
        String message = "Refund {} has been PROCESSING with no confirmed gateway refund id since {} "
                + "(outcome unknown after a prior gateway error) — needs manual reconciliation, idempotencyKey={}";
        if (escalate) {
            log.error(message, refund.getId(), refund.getUpdatedAt(), refund.getIdempotencyKey());
        } else {
            log.warn(message, refund.getId(), refund.getUpdatedAt(), refund.getIdempotencyKey());
        }
    }

    private static boolean hasNoConfirmedGatewayId(Refund refund) {
        String id = refund.getRazorpayRefundId();
        return id == null || id.isBlank() || id.startsWith(UNRESOLVED_CLAIM_PREFIX);
    }
}
