package com.MaSoVa.payment.service;

import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dev/demo seed for manager Payments / Refunds UI when live Stripe keys are not set.
 * Callable only when active profiles include {@code dev} or {@code demo}.
 * Prefer linking {@code orderIds} to real commerce Mongo order ids from reseed-all.
 */
@Service
public class PaymentSeedService {

    private static final Logger log = LoggerFactory.getLogger(PaymentSeedService.class);

    private final TransactionRepository transactionRepository;
    private final RefundRepository refundRepository;
    private final OrderServiceClient orderServiceClient;
    private final Environment environment;

    public PaymentSeedService(TransactionRepository transactionRepository,
                              RefundRepository refundRepository,
                              OrderServiceClient orderServiceClient,
                              Environment environment) {
        this.transactionRepository = transactionRepository;
        this.refundRepository = refundRepository;
        this.orderServiceClient = orderServiceClient;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Seed ≥3 SUCCESS/PARTIAL_REFUND transactions + 1 PROCESSED refund + 1 PENDING_APPROVAL refund.
     * Idempotent on orderId keys.
     *
     * @param linkedOrderIds optional commerce Mongo order ids (prefer ≥3 paid seed orders)
     */
    public Map<String, Object> seedDemo(String storeId, String customerId, List<String> linkedOrderIds) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Payment seed is only available under dev/demo profiles");
        }

        List<String> orderKeys = resolveOrderKeys(linkedOrderIds);
        List<String> transactionIds = new ArrayList<>();
        List<String> refundIds = new ArrayList<>();
        List<String> syncedOrders = new ArrayList<>();

        Transaction tx1 = upsertSyntheticTxn(
                orderKeys.get(0), storeId, customerId,
                new BigDecimal("24.90"), Transaction.PaymentStatus.SUCCESS, "STRIPE", true);
        transactionIds.add(tx1.getId());
        syncOrderPayment(tx1, "PAID", syncedOrders);

        Transaction tx2 = upsertSyntheticTxn(
                orderKeys.get(1), storeId, customerId,
                new BigDecimal("42.50"), Transaction.PaymentStatus.PARTIAL_REFUND, "STRIPE", true);
        transactionIds.add(tx2.getId());
        // Partial refund still leaves order PAID with refund rows
        syncOrderPayment(tx2, "PAID", syncedOrders);

        Refund partial = upsertRefund(
                "SEED-RFND-PARTIAL-1",
                tx2,
                new BigDecimal("10.00"),
                Refund.RefundType.PARTIAL,
                Refund.RefundStatus.PROCESSED,
                "seed-partial-item-missing",
                "manager-seed");
        refundIds.add(partial.getId());

        Transaction tx3 = upsertSyntheticTxn(
                orderKeys.get(2), storeId, customerId,
                new BigDecimal("15.00"), Transaction.PaymentStatus.SUCCESS, "CASH", false);
        transactionIds.add(tx3.getId());
        syncOrderPayment(tx3, "PAID", syncedOrders);

        Refund pending = upsertRefund(
                "SEED-RFND-PENDING-1",
                tx1,
                new BigDecimal("5.00"),
                Refund.RefundType.PARTIAL,
                Refund.RefundStatus.PENDING_APPROVAL,
                "agent-seed-customer-complaint",
                "AGENT");
        refundIds.add(pending.getId());

        log.info("Seeded payment demo data for store {}: txs={}, refunds={}, linkedOrders={}",
                storeId, transactionIds.size(), refundIds.size(), orderKeys);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("storeId", storeId);
        body.put("orderIds", orderKeys);
        body.put("transactionIds", transactionIds);
        body.put("refundIds", refundIds);
        body.put("syncedOrderPaymentStatus", syncedOrders);
        body.put("currency", "EUR");
        body.put("message", "Seeded ≥3 EUR transactions and ≥1 refund (plus pending approval)");
        return body;
    }

    /** Back-compat: no linked commerce ids. */
    public Map<String, Object> seedDemo(String storeId, String customerId) {
        return seedDemo(storeId, customerId, null);
    }

    private List<String> resolveOrderKeys(List<String> linkedOrderIds) {
        List<String> keys = new ArrayList<>();
        if (linkedOrderIds != null) {
            for (String id : linkedOrderIds) {
                if (id != null && !id.isBlank()) {
                    keys.add(id.trim());
                }
            }
        }
        // Fallbacks keep seed working without commerce link
        while (keys.size() < 3) {
            keys.add("SEED-ORD-PAY-" + (keys.size() + 1));
        }
        return keys.subList(0, 3);
    }

    private void syncOrderPayment(Transaction tx, String status, List<String> synced) {
        try {
            orderServiceClient.updateOrderPaymentStatus(tx.getOrderId(), status, tx.getId());
            synced.add(tx.getOrderId());
        } catch (Exception e) {
            // Synthetic SEED-ORD-PAY-* keys may not exist in commerce — non-fatal
            log.warn("Could not sync payment status to commerce for order {}: {}",
                    tx.getOrderId(), e.getMessage());
        }
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
            t.setCustomerEmail("anna.mueller@gmail.com");
            t.setCustomerPhone("+491511000011");
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
                .customerEmail("anna.mueller@gmail.com")
                .customerPhone("+491511000011")
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
        if (stripeShaped) {
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
        } else if (status == Refund.RefundStatus.PENDING_APPROVAL) {
            // Unique index on razorpayRefundId — never leave null for pending rows
            b.razorpayRefundId("pending_seed_" + shortId(seedKey));
        }

        Refund refund = b.build();
        if (status == Refund.RefundStatus.PROCESSED) {
            refund.setProcessedAt(LocalDateTime.now().minusHours(1));
        }
        return refundRepository.save(refund);
    }

    private static String shortId(String seed) {
        return Integer.toHexString(seed.hashCode() & 0xfffffff);
    }
}
