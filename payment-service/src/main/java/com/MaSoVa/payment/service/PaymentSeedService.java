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
 * <p>
 * Idempotency notes:
 * <ul>
 *   <li>{@code razorpayOrderId} is uniquely indexed and must never be null (Mongo allows only one null).</li>
 *   <li>Stable slot keys {@code SEED_RZP_1..3} identify seed rows across re-runs even when
 *       commerce links different order Mongo ids.</li>
 * </ul>
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
     * Idempotent via stable slot keys (not only orderId).
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

        // Slot 1 — Stripe SUCCESS (linked commerce order or SEED-ORD-PAY-1)
        Transaction tx1 = upsertSyntheticTxn(
                1, orderKeys.get(0), storeId, customerId,
                new BigDecimal("24.90"), Transaction.PaymentStatus.SUCCESS, "STRIPE", true);
        transactionIds.add(tx1.getId());
        syncOrderPayment(tx1, "PAID", syncedOrders);

        // Slot 2 — Stripe PARTIAL_REFUND
        Transaction tx2 = upsertSyntheticTxn(
                2, orderKeys.get(1), storeId, customerId,
                new BigDecimal("42.50"), Transaction.PaymentStatus.PARTIAL_REFUND, "STRIPE", true);
        transactionIds.add(tx2.getId());
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

        // Slot 3 — Cash SUCCESS
        Transaction tx3 = upsertSyntheticTxn(
                3, orderKeys.get(2), storeId, customerId,
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
            log.warn("Could not sync payment status to commerce for order {}: {}",
                    tx.getOrderId(), e.getMessage());
        }
    }

    /**
     * Upsert by stable slot identity so re-seed with new commerce order Mongo ids
     * does not insert duplicates under unique razorpayOrderId / orderId indexes.
     */
    private Transaction upsertSyntheticTxn(
            int slot,
            String orderId,
            String storeId,
            String customerId,
            BigDecimal amount,
            Transaction.PaymentStatus status,
            String gateway,
            boolean stripeShaped) {

        // Stable unique keys — never null (unique index on razorpayOrderId forbids multi-null)
        String seedRzpOrderId = "SEED_RZP_" + slot;
        String seedReceipt = "SEED_RCPT_" + slot;
        String seedStripePi = "pi_seed_slot_" + slot;
        String seedRzpPaymentId = "ch_seed_slot_" + slot;

        Optional<Transaction> existing = findExistingSeedTxn(orderId, seedRzpOrderId, seedStripePi);

        if (existing.isPresent()) {
            Transaction t = existing.get();
            // Re-link to current commerce order id when provided
            if (orderId != null && !orderId.equals(t.getOrderId())) {
                // Only reassign if no other tx already owns this orderId
                Optional<Transaction> conflict = transactionRepository.findByOrderId(orderId);
                if (conflict.isEmpty() || conflict.get().getId().equals(t.getId())) {
                    t.setOrderId(orderId);
                }
            }
            t.setStatus(status);
            t.setAmount(amount);
            t.setStoreId(storeId);
            t.setCustomerId(customerId);
            t.setPaymentGateway(gateway);
            t.setCurrency("EUR");
            t.setCustomerEmail("anna.mueller@gmail.com");
            t.setCustomerPhone("+491511000011");
            t.setReceipt(seedReceipt);
            // Always keep non-null unique gateway id
            t.setRazorpayOrderId(seedRzpOrderId);
            if (stripeShaped) {
                t.setStripePaymentIntentId(seedStripePi);
                t.setRazorpayPaymentId(seedRzpPaymentId);
                t.setPaymentMethod(Transaction.PaymentMethod.CARD);
                t.setPaymentMethodType("card");
            } else {
                t.setStripePaymentIntentId(null);
                t.setRazorpayPaymentId(seedRzpPaymentId);
                t.setPaymentMethod(Transaction.PaymentMethod.CASH);
                t.setPaymentMethodType("cash");
            }
            if (t.getPaidAt() == null) {
                t.setPaidAt(LocalDateTime.now().minusHours(2));
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
                .receipt(seedReceipt)
                .currency("EUR")
                .paymentGateway(gateway)
                .reconciled(false)
                // CRITICAL: unique non-null — never leave razorpayOrderId null
                .razorpayOrderId(seedRzpOrderId);

        if (stripeShaped) {
            b.stripePaymentIntentId(seedStripePi);
        }

        Transaction t = b.build();
        t.setPaymentMethod(stripeShaped ? Transaction.PaymentMethod.CARD : Transaction.PaymentMethod.CASH);
        t.setPaymentMethodType(stripeShaped ? "card" : "cash");
        t.setPaidAt(LocalDateTime.now().minusHours(2));
        t.setRazorpayPaymentId(seedRzpPaymentId);
        return transactionRepository.save(t);
    }

    private Optional<Transaction> findExistingSeedTxn(String orderId, String seedRzpOrderId, String seedStripePi) {
        Optional<Transaction> byOrder = transactionRepository.findByOrderId(orderId);
        if (byOrder.isPresent()) {
            return byOrder;
        }
        Optional<Transaction> byRzp = transactionRepository.findByRazorpayOrderId(seedRzpOrderId);
        if (byRzp.isPresent()) {
            return byRzp;
        }
        Optional<Transaction> byStripe = transactionRepository.findByStripePaymentIntentId(seedStripePi);
        if (byStripe.isPresent()) {
            return byStripe;
        }
        // Legacy Phase C keys SEED-ORD-PAY-N
        if (orderId != null && !orderId.startsWith("SEED-ORD-PAY-")) {
            // try slot-shaped legacy only via razorpay id already handled
        }
        return Optional.empty();
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
                r.setOrderId(tx.getOrderId());
                return refundRepository.save(r);
            }
        }

        // Also match by stable razorpayRefundId if notes missing
        String stableRefundId = status == Refund.RefundStatus.PENDING_APPROVAL
                ? "pending_seed_" + shortId(seedKey)
                : "syn_rfnd_seed_" + shortId(seedKey);

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
                        : tx.getRazorpayPaymentId())
                .razorpayRefundId(stableRefundId);

        Refund refund = b.build();
        if (status == Refund.RefundStatus.PROCESSED) {
            refund.setProcessedAt(LocalDateTime.now().minusHours(1));
        }
        try {
            return refundRepository.save(refund);
        } catch (Exception e) {
            // Race / unique razorpayRefundId from prior seed — re-fetch and update
            log.warn("Refund seed save collision for {}: {}", seedKey, e.getMessage());
            List<Refund> again = refundRepository.findByTransactionId(tx.getId());
            for (Refund r : again) {
                if (r.getNotes() != null && r.getNotes().contains(seedKey)) {
                    r.setStatus(status);
                    r.setAmount(amount);
                    return refundRepository.save(r);
                }
            }
            throw e;
        }
    }

    private static String shortId(String seed) {
        return Integer.toHexString(seed.hashCode() & 0xfffffff);
    }
}
