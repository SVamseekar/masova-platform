package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class RefundService {

    private static final Logger log = LoggerFactory.getLogger(RefundService.class);

    private final RefundRepository refundRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentGatewayResolver paymentGatewayResolver;
    private final OrderServiceClient orderServiceClient;

    public RefundService(RefundRepository refundRepository,
                         TransactionRepository transactionRepository,
                         PaymentGatewayResolver paymentGatewayResolver,
                         OrderServiceClient orderServiceClient) {
        this.refundRepository = refundRepository;
        this.transactionRepository = transactionRepository;
        this.paymentGatewayResolver = paymentGatewayResolver;
        this.orderServiceClient = orderServiceClient;
    }

    /**
     * Manager-initiated path — validates and immediately executes the refund
     * through Stripe (EU), Razorpay (IN), or a local synthetic path for cash/demo txs.
     */
    @Transactional
    public Refund initiateRefund(RefundRequest request) {
        try {
            log.info("Initiating refund for transaction: {}, amount: {}",
                    request.getTransactionId(), request.getAmount());

            Transaction transaction = loadAndValidateRefundable(request);
            return executeRefund(request, transaction, null);

        } catch (RuntimeException e) {
            log.error("Error initiating refund", e);
            throw e;
        } catch (Exception e) {
            log.error("Error initiating refund", e);
            throw new RuntimeException("Failed to initiate refund: " + e.getMessage(), e);
        }
    }

    /**
     * Request a refund that requires manager approval before any money moves
     * (agent / customer path). No gateway call until {@link #approveRefund}.
     */
    @Transactional
    public Refund requestRefundApproval(RefundRequest request) {
        log.info("Recording refund approval request for transaction: {}, amount: {}, requestedBy: {}",
                request.getTransactionId(), request.getAmount(), request.getInitiatedBy());

        Transaction transaction = loadAndValidateRefundable(request);

        // Unique placeholder required: razorpayRefundId has a unique index; multiple nulls → E11000.
        String pendingKey = "pending_" + UUID.randomUUID().toString().replace("-", "");

        Refund refund = Refund.builder()
                .transactionId(request.getTransactionId())
                .orderId(transaction.getOrderId())
                .storeId(transaction.getStoreId())
                .razorpayPaymentId(gatewayPaymentId(transaction))
                .razorpayRefundId(pendingKey)
                .amount(request.getAmount())
                .status(Refund.RefundStatus.PENDING_APPROVAL)
                .type(request.getType())
                .reason(request.getReason())
                .initiatedBy(request.getInitiatedBy())
                .customerId(transaction.getCustomerId())
                .speed(request.getSpeed() != null ? request.getSpeed() : "normal")
                .notes(request.getNotes())
                .build();

        refund = Objects.requireNonNull(refundRepository.save(refund));
        log.info("Refund recorded as PENDING_APPROVAL. Refund ID: {} (no money moved)", refund.getId());
        return refund;
    }

    /**
     * Manager approval of a PENDING_APPROVAL refund — executes via the transaction's gateway.
     */
    @Transactional
    public Refund approveRefund(String refundId, String approvedBy) {
        try {
            Refund pending = getRefund(refundId);
            if (pending.getStatus() != Refund.RefundStatus.PENDING_APPROVAL) {
                throw new RuntimeException("Refund is not pending approval (status: " + pending.getStatus() + ")");
            }

            Transaction transaction = transactionRepository.findById(Objects.requireNonNull(pending.getTransactionId()))
                    .orElseThrow(() -> new RuntimeException("Transaction not found: " + pending.getTransactionId()));

            RefundRequest request = RefundRequest.builder()
                    .transactionId(pending.getTransactionId())
                    .amount(pending.getAmount())
                    .type(pending.getType())
                    .reason(pending.getReason())
                    .initiatedBy(approvedBy != null ? approvedBy : pending.getInitiatedBy())
                    .speed(pending.getSpeed())
                    .notes(pending.getNotes())
                    .build();
            // Exclude this pending row from availability — it already holds the amount.
            validateRefundable(request, transaction, pending.getId());

            return executeRefund(request, transaction, pending);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error approving refund {}", refundId, e);
            throw new RuntimeException("Failed to approve refund: " + e.getMessage(), e);
        }
    }

    /**
     * Manager rejection of a PENDING_APPROVAL refund — no money moves.
     */
    @Transactional
    public Refund rejectRefund(String refundId, String rejectedBy, String rejectionReason) {
        Refund pending = getRefund(refundId);
        if (pending.getStatus() != Refund.RefundStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Refund is not pending approval (status: " + pending.getStatus() + ")");
        }
        pending.setStatus(Refund.RefundStatus.REJECTED);
        if (rejectionReason != null && !rejectionReason.isBlank()) {
            pending.setNotes((pending.getNotes() != null ? pending.getNotes() + " | " : "")
                    + "Rejected by " + rejectedBy + ": " + rejectionReason);
        }
        Refund saved = refundRepository.save(pending);
        log.info("Refund {} rejected by {} (no money moved)", saved.getId(), rejectedBy);
        return saved;
    }

    private Transaction loadAndValidateRefundable(RefundRequest request) {
        Transaction transaction = transactionRepository.findById(Objects.requireNonNull(request.getTransactionId()))
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + request.getTransactionId()));
        validateRefundable(request, transaction, null);
        return transaction;
    }

    private void validateRefundable(RefundRequest request, Transaction transaction, String excludeRefundId) {
        if (transaction.getStatus() != Transaction.PaymentStatus.SUCCESS
                && transaction.getStatus() != Transaction.PaymentStatus.PARTIAL_REFUND) {
            throw new RuntimeException("Cannot refund transaction with status: " + transaction.getStatus());
        }
        if (request.getAmount().compareTo(transaction.getAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed transaction amount");
        }

        List<Refund> existingRefunds = refundRepository.findByTransactionId(request.getTransactionId());
        BigDecimal totalCommitted = existingRefunds.stream()
                .filter(r -> excludeRefundId == null || !excludeRefundId.equals(r.getId()))
                .filter(r -> r.getStatus() == Refund.RefundStatus.PROCESSED
                        || r.getStatus() == Refund.RefundStatus.PENDING_APPROVAL
                        || r.getStatus() == Refund.RefundStatus.INITIATED
                        || r.getStatus() == Refund.RefundStatus.PROCESSING)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableForRefund = transaction.getAmount().subtract(totalCommitted);
        if (request.getAmount().compareTo(availableForRefund) > 0) {
            throw new RuntimeException("Refund amount exceeds available amount. Available: " + availableForRefund);
        }
    }

    /**
     * Execute refund through the correct gateway (or synthetic local path).
     *
     * @param existingPending if non-null, update that PENDING_APPROVAL row instead of creating a new one
     */
    private Refund executeRefund(RefundRequest request, Transaction transaction, Refund existingPending)
            throws Exception {
        String speed = request.getSpeed() != null ? request.getSpeed() : "normal";
        String paymentId = gatewayPaymentId(transaction);
        GatewayRefundOutcome outcome = performGatewayRefund(transaction, paymentId, request.getAmount(), speed);

        Refund refund;
        if (existingPending != null) {
            refund = existingPending;
            refund.setInitiatedBy(request.getInitiatedBy());
        } else {
            refund = Refund.builder()
                    .transactionId(request.getTransactionId())
                    .orderId(transaction.getOrderId())
                    .storeId(transaction.getStoreId())
                    .razorpayPaymentId(paymentId)
                    .amount(request.getAmount())
                    .type(request.getType())
                    .reason(request.getReason())
                    .initiatedBy(request.getInitiatedBy())
                    .customerId(transaction.getCustomerId())
                    .speed(speed)
                    .notes(request.getNotes())
                    .build();
        }

        refund.setRazorpayRefundId(outcome.gatewayRefundId());
        refund.setStatus(outcome.status());
        if (outcome.status() == Refund.RefundStatus.PROCESSED) {
            refund.setProcessedAt(LocalDateTime.now());
        }
        if (refund.getStoreId() == null) {
            refund.setStoreId(transaction.getStoreId());
        }
        if (refund.getRazorpayPaymentId() == null) {
            refund.setRazorpayPaymentId(paymentId);
        }

        refund = Objects.requireNonNull(refundRepository.save(refund));

        updateTransactionStatusAfterRefund(transaction, request.getAmount());
        orderServiceClient.updateOrderPaymentStatus(transaction.getOrderId(), "REFUNDED", transaction.getId());

        log.info("Refund executed. Refund ID: {}, gatewayRefundId: {}, gateway: {}, status: {}",
                refund.getId(), outcome.gatewayRefundId(), outcome.gatewayName(), refund.getStatus());
        return refund;
    }

    private GatewayRefundOutcome performGatewayRefund(
            Transaction transaction, String paymentId, BigDecimal amount, String speed) throws Exception {
        String gatewayName = resolveGatewayName(transaction);

        // Cash / synthetic / missing gateway ids — local bookkeeping only (demo + POS cash).
        if (isSyntheticPaymentId(paymentId) || "CASH".equalsIgnoreCase(gatewayName)
                || "SYNTHETIC".equalsIgnoreCase(gatewayName)) {
            String synId = "syn_rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            log.info("Synthetic refund {} for transaction {} (no live PSP call)", synId, transaction.getId());
            return new GatewayRefundOutcome(synId, Refund.RefundStatus.PROCESSED, "SYNTHETIC");
        }

        PaymentGateway gateway = paymentGatewayResolver.resolveByGatewayName(gatewayName);
        String gatewayRefundId = gateway.refund(paymentId, amount, speed);

        // Stripe refunds settle immediately in test mode; Razorpay often returns processing.
        Refund.RefundStatus status = "STRIPE".equalsIgnoreCase(gateway.getGatewayName())
                ? Refund.RefundStatus.PROCESSED
                : Refund.RefundStatus.PROCESSING;
        return new GatewayRefundOutcome(gatewayRefundId, status, gateway.getGatewayName());
    }

    private static String resolveGatewayName(Transaction transaction) {
        if (transaction.getPaymentGateway() != null && !transaction.getPaymentGateway().isBlank()) {
            return transaction.getPaymentGateway();
        }
        if (transaction.getStripePaymentIntentId() != null && !transaction.getStripePaymentIntentId().isBlank()) {
            return "STRIPE";
        }
        if (transaction.getPaymentMethod() == Transaction.PaymentMethod.CASH) {
            return "CASH";
        }
        if (transaction.getRazorpayPaymentId() != null && !transaction.getRazorpayPaymentId().isBlank()) {
            return "RAZORPAY";
        }
        return "SYNTHETIC";
    }

    /** Charge / PaymentIntent / cash id stored for gateway refund calls. */
    private static String gatewayPaymentId(Transaction transaction) {
        if ("STRIPE".equalsIgnoreCase(transaction.getPaymentGateway())
                || (transaction.getStripePaymentIntentId() != null
                    && !transaction.getStripePaymentIntentId().isBlank())) {
            return transaction.getStripePaymentIntentId();
        }
        if (transaction.getRazorpayPaymentId() != null && !transaction.getRazorpayPaymentId().isBlank()) {
            return transaction.getRazorpayPaymentId();
        }
        if (transaction.getRazorpayOrderId() != null && transaction.getRazorpayOrderId().startsWith("CASH_")) {
            return transaction.getRazorpayOrderId();
        }
        return transaction.getRazorpayPaymentId();
    }

    private static boolean isSyntheticPaymentId(String paymentId) {
        if (paymentId == null || paymentId.isBlank()) {
            return true;
        }
        return paymentId.startsWith("CASH_")
                || paymentId.startsWith("syn_")
                || paymentId.startsWith("SYN_");
    }

    public Refund getRefund(String refundId) {
        return refundRepository.findById(Objects.requireNonNull(refundId))
                .orElseThrow(() -> new RuntimeException("Refund not found: " + refundId));
    }

    public List<Refund> getRefundsByTransactionId(String transactionId) {
        return refundRepository.findByTransactionId(transactionId);
    }

    public List<Refund> getRefundsByOrderId(String orderId) {
        return refundRepository.findByOrderId(orderId);
    }

    public List<Refund> getRefundsByCustomerId(String customerId) {
        return refundRepository.findByCustomerId(customerId);
    }

    public List<Refund> getRefundsByStoreId(String storeId) {
        return refundRepository.findByStoreId(storeId);
    }

    public List<Refund> getRefundsByStoreIdAndStatus(String storeId, Refund.RefundStatus status) {
        return refundRepository.findByStoreIdAndStatus(storeId, status);
    }

    public List<Refund> getRefundsByStatus(Refund.RefundStatus status) {
        return refundRepository.findByStatus(status);
    }

    /**
     * Update refund status (called by webhook or scheduled job).
     * {@code gatewayRefundId} is stored in {@code razorpayRefundId} for both PSPs.
     */
    @Transactional
    public void updateRefundStatus(String gatewayRefundId, String status) {
        Refund refund = refundRepository.findByRazorpayRefundId(gatewayRefundId)
                .orElseThrow(() -> new RuntimeException("Refund not found: " + gatewayRefundId));

        Refund.RefundStatus newStatus;
        if ("processed".equalsIgnoreCase(status) || "succeeded".equalsIgnoreCase(status)) {
            newStatus = Refund.RefundStatus.PROCESSED;
            refund.setProcessedAt(LocalDateTime.now());
        } else if ("processing".equalsIgnoreCase(status) || "pending".equalsIgnoreCase(status)) {
            newStatus = Refund.RefundStatus.PROCESSING;
        } else if ("failed".equalsIgnoreCase(status)) {
            newStatus = Refund.RefundStatus.FAILED;
        } else {
            log.warn("Unknown refund status: {}", status);
            return;
        }

        refund.setStatus(newStatus);
        refundRepository.save(refund);
        log.info("Refund status updated. Refund ID: {}, Status: {}", refund.getId(), newStatus);
    }

    /**
     * Recalculate transaction refund status from committed refund rows already persisted.
     * {@code justRefunded} is a floor so unit tests / races where the save is not yet
     * visible in {@code findByTransactionId} still mark PARTIAL/FULL correctly.
     */
    private void updateTransactionStatusAfterRefund(Transaction transaction, BigDecimal justRefunded) {
        List<Refund> allRefunds = refundRepository.findByTransactionId(transaction.getId());
        BigDecimal totalRefunded = allRefunds.stream()
                .filter(r -> r.getStatus() == Refund.RefundStatus.PROCESSED
                        || r.getStatus() == Refund.RefundStatus.PROCESSING
                        || r.getStatus() == Refund.RefundStatus.INITIATED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // Floor for unit tests / races where the just-saved row is not yet returned by find.
        // Only apply when the repo sum is empty so we never under-count prior refunds.
        if (totalRefunded.signum() == 0 && justRefunded != null) {
            totalRefunded = justRefunded;
        }

        if (totalRefunded.compareTo(transaction.getAmount()) >= 0) {
            transaction.setStatus(Transaction.PaymentStatus.REFUNDED);
        } else if (totalRefunded.compareTo(BigDecimal.ZERO) > 0) {
            transaction.setStatus(Transaction.PaymentStatus.PARTIAL_REFUND);
        }

        transactionRepository.save(transaction);
        log.info("Transaction status updated after refund. Transaction ID: {}, Status: {}, totalRefunded: {}",
                transaction.getId(), transaction.getStatus(), totalRefunded);
    }

    private record GatewayRefundOutcome(
            String gatewayRefundId,
            Refund.RefundStatus status,
            String gatewayName) {}
}
