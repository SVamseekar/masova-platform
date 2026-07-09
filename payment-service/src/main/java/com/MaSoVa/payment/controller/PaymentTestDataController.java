package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dev-only seed for manager Payments / Refunds UI when live Stripe keys are not set.
 * Never enable outside {@code dev} / {@code demo}.
 */
@Profile({"dev", "demo"})
@RestController
@RequestMapping("/api/payments/test-data")
@Tag(name = "Payment Test Data", description = "Dev seed for synthetic transactions/refunds")
public class PaymentTestDataController {

    private static final Logger log = LoggerFactory.getLogger(PaymentTestDataController.class);

    private final TransactionRepository transactionRepository;
    private final RefundRepository refundRepository;

    public PaymentTestDataController(TransactionRepository transactionRepository,
                                     RefundRepository refundRepository) {
        this.transactionRepository = transactionRepository;
        this.refundRepository = refundRepository;
    }

    /**
     * Seed ≥3 SUCCESS transactions + 1 PROCESSED refund + 1 PENDING_APPROVAL refund for a store.
     * Idempotent on fixed orderIds.
     */
    /**
     * POST /api/payments/test-data/seed-demo — manager JWT via gateway.
     * Seed ≥3 SUCCESS transactions + 1 PROCESSED refund + 1 PENDING_APPROVAL refund.
     */
    @PostMapping("/seed-demo")
    @Operation(summary = "Seed synthetic Stripe-like transactions and refunds for demo store")
    public ResponseEntity<Map<String, Object>> seedDemo(
            @RequestParam(defaultValue = "DOM001") String storeId,
            @RequestParam(defaultValue = "cust-demo-1") String customerId) {

        List<String> transactionIds = new ArrayList<>();
        List<String> refundIds = new ArrayList<>();

        // Tx 1 — SUCCESS, fully refundable (Stripe-shaped)
        Transaction tx1 = upsertSyntheticTxn(
                "SEED-ORD-PAY-1", storeId, customerId,
                new BigDecimal("24.90"), Transaction.PaymentStatus.SUCCESS, "STRIPE", true);
        transactionIds.add(tx1.getId());

        // Tx 2 — SUCCESS, partial refund already applied
        Transaction tx2 = upsertSyntheticTxn(
                "SEED-ORD-PAY-2", storeId, customerId,
                new BigDecimal("42.50"), Transaction.PaymentStatus.PARTIAL_REFUND, "STRIPE", true);
        transactionIds.add(tx2.getId());

        Refund partial = upsertRefund(
                "SEED-RFND-PARTIAL-1",
                tx2,
                new BigDecimal("10.00"),
                Refund.RefundType.PARTIAL,
                Refund.RefundStatus.PROCESSED,
                "seed-partial-item-missing",
                "manager-seed");
        refundIds.add(partial.getId());

        // Tx 3 — SUCCESS cash (synthetic refund path)
        Transaction tx3 = upsertSyntheticTxn(
                "SEED-ORD-PAY-3", storeId, customerId,
                new BigDecimal("15.00"), Transaction.PaymentStatus.SUCCESS, "CASH", false);
        transactionIds.add(tx3.getId());

        // Pending agent refund on tx1 (approval-gated — no money moved)
        Refund pending = upsertRefund(
                "SEED-RFND-PENDING-1",
                tx1,
                new BigDecimal("5.00"),
                Refund.RefundType.PARTIAL,
                Refund.RefundStatus.PENDING_APPROVAL,
                "agent-seed-customer-complaint",
                "AGENT");
        refundIds.add(pending.getId());

        log.info("Seeded payment demo data for store {}: txs={}, refunds={}",
                storeId, transactionIds.size(), refundIds.size());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("storeId", storeId);
        body.put("transactionIds", transactionIds);
        body.put("refundIds", refundIds);
        body.put("message", "Seeded ≥3 transactions and ≥1 refund (plus pending approval)");
        return ResponseEntity.ok(body);
    }

    private Transaction upsertSyntheticTxn(
            String orderId,
            String storeId,
            String customerId,
            BigDecimal amount,
            Transaction.PaymentStatus status,
            String gateway,
            boolean stripeShaped) {

        Optional<Transaction> existing = transactionRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            Transaction t = existing.get();
            t.setStatus(status);
            t.setAmount(amount);
            t.setStoreId(storeId);
            t.setCustomerId(customerId);
            t.setPaymentGateway(gateway);
            t.setCurrency("EUR");
            if (stripeShaped && t.getStripePaymentIntentId() == null) {
                t.setStripePaymentIntentId("pi_seed_" + shortId(orderId));
            }
            return transactionRepository.save(t);
        }

        Transaction.Builder b = Transaction.builder()
                .orderId(orderId)
                .amount(amount)
                .status(status)
                .customerId(customerId)
                .customerEmail("seed.customer@example.com")
                .customerPhone("+4915112345678")
                .storeId(storeId)
                .receipt("SEED_" + shortId(orderId))
                .currency("EUR")
                .paymentGateway(gateway)
                .reconciled(false);

        if (stripeShaped) {
            b.stripePaymentIntentId("pi_seed_" + shortId(orderId));
        } else {
            b.razorpayOrderId("CASH_" + orderId);
        }

        Transaction t = b.build();
        t.setPaymentMethod(stripeShaped ? Transaction.PaymentMethod.CARD : Transaction.PaymentMethod.CASH);
        t.setPaymentMethodType(stripeShaped ? "card" : "cash");
        t.setPaidAt(LocalDateTime.now().minusHours(2));
        if (!stripeShaped) {
            // leave razorpayPaymentId null — synthetic refund path
        } else {
            t.setRazorpayPaymentId("ch_seed_" + shortId(orderId));
        }
        return transactionRepository.save(t);
    }

    private Refund upsertRefund(
            String seedKey,
            Transaction tx,
            BigDecimal amount,
            Refund.RefundType type,
            Refund.RefundStatus status,
            String reason,
            String initiatedBy) {

        // Find existing by notes seed key to stay idempotent
        List<Refund> existing = refundRepository.findByTransactionId(tx.getId());
        for (Refund r : existing) {
            if (r.getNotes() != null && r.getNotes().contains(seedKey)) {
                r.setStatus(status);
                r.setAmount(amount);
                r.setStoreId(tx.getStoreId());
                return refundRepository.save(r);
            }
        }

        Refund.Builder b = Refund.builder()
                .transactionId(tx.getId())
                .orderId(tx.getOrderId())
                .storeId(tx.getStoreId())
                .amount(amount)
                .status(status)
                .type(type)
                .reason(reason)
                .initiatedBy(initiatedBy)
                .customerId(tx.getCustomerId())
                .speed("normal")
                .notes("seed:" + seedKey)
                .razorpayPaymentId(tx.getStripePaymentIntentId() != null
                        ? tx.getStripePaymentIntentId()
                        : tx.getRazorpayPaymentId());

        if (status == Refund.RefundStatus.PROCESSED || status == Refund.RefundStatus.PROCESSING) {
            b.razorpayRefundId("syn_rfnd_seed_" + shortId(seedKey));
        }

        Refund refund = b.build();
        if (status == Refund.RefundStatus.PROCESSED) {
            refund.setProcessedAt(LocalDateTime.now().minusHours(1));
        }
        // Avoid unique index collision on null razorpayRefundId for multiple PENDING rows
        if (refund.getRazorpayRefundId() == null && status == Refund.RefundStatus.PENDING_APPROVAL) {
            // leave null — Mongo unique sparse index typically allows multiple nulls
        }
        return refundRepository.save(refund);
    }

    private static String shortId(String seed) {
        return Integer.toHexString(seed.hashCode() & 0xfffffff);
    }
}
