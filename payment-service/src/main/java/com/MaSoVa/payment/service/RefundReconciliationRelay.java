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
        }
    }

    double countStuck() {
        return refundRepository.countByStatusAndUpdatedAtBefore(Refund.RefundStatus.PROCESSING, cutoff());
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
            log.warn("Refund {} has been PROCESSING with no confirmed gateway refund id since {} "
                            + "(outcome unknown after a prior gateway error) — needs manual reconciliation, "
                            + "idempotencyKey={}",
                    refund.getId(), refund.getUpdatedAt(), refund.getIdempotencyKey());
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
        refundService.updateRefundStatus(refund.getRazorpayRefundId(), gatewayStatus);
        log.info("Reconciled refund {} via gateway lookup: gateway={}, status={}",
                refund.getId(), gatewayName, gatewayStatus);
    }

    private static boolean hasNoConfirmedGatewayId(Refund refund) {
        String id = refund.getRazorpayRefundId();
        return id == null || id.isBlank() || id.startsWith(UNRESOLVED_CLAIM_PREFIX);
    }
}
