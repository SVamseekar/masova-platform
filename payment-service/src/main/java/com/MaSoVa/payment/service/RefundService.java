package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class RefundService {

    private static final Logger log = LoggerFactory.getLogger(RefundService.class);

    private final RefundRepository refundRepository;
    private final TransactionRepository transactionRepository;
    private final RazorpayService razorpayService;
    private final OrderServiceClient orderServiceClient;

    public RefundService(RefundRepository refundRepository, TransactionRepository transactionRepository,
                        RazorpayService razorpayService, OrderServiceClient orderServiceClient) {
        this.refundRepository = refundRepository;
        this.transactionRepository = transactionRepository;
        this.razorpayService = razorpayService;
        this.orderServiceClient = orderServiceClient;
    }

    /**
     * Initiate refund — manager-initiated path. Validates and immediately executes the
     * refund through Razorpay. This is the existing direct-refund flow used by the manager UI.
     */
    @Transactional
    public Refund initiateRefund(RefundRequest request) {
        try {
            log.info("Initiating refund for transaction: {}, amount: {}", request.getTransactionId(), request.getAmount());

            Transaction transaction = loadAndValidateRefundable(request);
            return executeRefund(request, transaction);

        } catch (RazorpayException e) {
            log.error("Razorpay error while initiating refund", e);
            throw new RuntimeException("Failed to initiate refund: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Error initiating refund", e);
            throw e;
        } catch (Exception e) {
            log.error("Error initiating refund", e);
            throw new RuntimeException("Failed to initiate refund", e);
        }
    }

    /**
     * Request a refund that requires manager approval before any money moves
     * (security remediation Task 4). Used by the AI agent / customer-facing path.
     *
     * The request is validated against the transaction (so callers get immediate feedback on
     * invalid requests) but NO Razorpay refund is created and the transaction/order are NOT
     * touched. The refund record is persisted in PENDING_APPROVAL status and only an explicit
     * manager approval (see {@link #approveRefund}) will execute it.
     */
    @Transactional
    public Refund requestRefundApproval(RefundRequest request) {
        log.info("Recording refund approval request for transaction: {}, amount: {}, requestedBy: {}",
                request.getTransactionId(), request.getAmount(), request.getInitiatedBy());

        Transaction transaction = loadAndValidateRefundable(request);

        Refund refund = Refund.builder()
                .transactionId(request.getTransactionId())
                .orderId(transaction.getOrderId())
                .razorpayPaymentId(transaction.getRazorpayPaymentId())
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
     * Manager approval of a PENDING_APPROVAL refund — executes the actual refund via Razorpay.
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

            // Re-validate against current state (guards against double-processing / new refunds since request).
            RefundRequest request = RefundRequest.builder()
                    .transactionId(pending.getTransactionId())
                    .amount(pending.getAmount())
                    .type(pending.getType())
                    .reason(pending.getReason())
                    .initiatedBy(approvedBy != null ? approvedBy : pending.getInitiatedBy())
                    .speed(pending.getSpeed())
                    .notes(pending.getNotes())
                    .build();
            validateRefundable(request, transaction);

            // Execute on the existing pending record (so we never create a duplicate refund row).
            String speed = pending.getSpeed() != null ? pending.getSpeed() : "normal";
            JSONObject razorpayRefund = razorpayService.createRefund(
                    transaction.getRazorpayPaymentId(), pending.getAmount(), speed);

            pending.setRazorpayRefundId(razorpayRefund.getString("id"));
            pending.setInitiatedBy(request.getInitiatedBy());
            applyRazorpayStatus(pending, razorpayRefund.getString("status"), Refund.RefundStatus.INITIATED);

            Refund saved = Objects.requireNonNull(refundRepository.save(pending));

            updateTransactionStatusAfterRefund(transaction, saved.getAmount());
            orderServiceClient.updateOrderPaymentStatus(transaction.getOrderId(), "REFUNDED", transaction.getId());

            log.info("Refund {} approved by {} and executed. Razorpay Refund ID: {}",
                    saved.getId(), approvedBy, saved.getRazorpayRefundId());
            return saved;

        } catch (RazorpayException e) {
            log.error("Razorpay error while approving refund {}", refundId, e);
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

    /**
     * Load the transaction for a refund request and validate it is refundable for the
     * requested amount. Shared by the direct, request-approval and approval paths.
     */
    private Transaction loadAndValidateRefundable(RefundRequest request) {
        Transaction transaction = transactionRepository.findById(Objects.requireNonNull(request.getTransactionId()))
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + request.getTransactionId()));
        validateRefundable(request, transaction);
        return transaction;
    }

    private void validateRefundable(RefundRequest request, Transaction transaction) {
        if (transaction.getStatus() != Transaction.PaymentStatus.SUCCESS
                && transaction.getStatus() != Transaction.PaymentStatus.PARTIAL_REFUND) {
            throw new RuntimeException("Cannot refund transaction with status: " + transaction.getStatus());
        }
        if (request.getAmount().compareTo(transaction.getAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed transaction amount");
        }

        // Only money already refunded (PROCESSED) reduces what's available — pending requests do not.
        List<Refund> existingRefunds = refundRepository.findByTransactionId(request.getTransactionId());
        BigDecimal totalRefunded = existingRefunds.stream()
                .filter(r -> r.getStatus() == Refund.RefundStatus.PROCESSED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableForRefund = transaction.getAmount().subtract(totalRefunded);
        if (request.getAmount().compareTo(availableForRefund) > 0) {
            throw new RuntimeException("Refund amount exceeds available amount. Available: " + availableForRefund);
        }
    }

    /**
     * Execute a validated refund through Razorpay and persist a new refund record.
     * Caller is responsible for prior validation via {@link #validateRefundable}.
     */
    private Refund executeRefund(RefundRequest request, Transaction transaction) throws RazorpayException {
        String speed = request.getSpeed() != null ? request.getSpeed() : "normal";
        JSONObject razorpayRefund = razorpayService.createRefund(
                transaction.getRazorpayPaymentId(), request.getAmount(), speed);

        Refund refund = Refund.builder()
                .transactionId(request.getTransactionId())
                .orderId(transaction.getOrderId())
                .razorpayRefundId(razorpayRefund.getString("id"))
                .razorpayPaymentId(transaction.getRazorpayPaymentId())
                .amount(request.getAmount())
                .status(Refund.RefundStatus.INITIATED)
                .type(request.getType())
                .reason(request.getReason())
                .initiatedBy(request.getInitiatedBy())
                .customerId(transaction.getCustomerId())
                .speed(speed)
                .notes(request.getNotes())
                .build();

        applyRazorpayStatus(refund, razorpayRefund.getString("status"), Refund.RefundStatus.INITIATED);

        refund = Objects.requireNonNull(refundRepository.save(refund));

        updateTransactionStatusAfterRefund(transaction, request.getAmount());
        orderServiceClient.updateOrderPaymentStatus(transaction.getOrderId(), "REFUNDED", transaction.getId());

        log.info("Refund initiated successfully. Refund ID: {}, Razorpay Refund ID: {}",
                 refund.getId(), refund.getRazorpayRefundId());
        return refund;
    }

    private void applyRazorpayStatus(Refund refund, String razorpayStatus, Refund.RefundStatus fallback) {
        if ("processed".equalsIgnoreCase(razorpayStatus)) {
            refund.setStatus(Refund.RefundStatus.PROCESSED);
            refund.setProcessedAt(LocalDateTime.now());
        } else if ("processing".equalsIgnoreCase(razorpayStatus)) {
            refund.setStatus(Refund.RefundStatus.PROCESSING);
        } else {
            refund.setStatus(fallback);
        }
    }

    /**
     * Get refund by ID
     */
    public Refund getRefund(String refundId) {
        return refundRepository.findById(Objects.requireNonNull(refundId))
                .orElseThrow(() -> new RuntimeException("Refund not found: " + refundId));
    }

    /**
     * Get refunds by transaction ID
     */
    public List<Refund> getRefundsByTransactionId(String transactionId) {
        return refundRepository.findByTransactionId(transactionId);
    }

    /**
     * Get refunds by order ID
     */
    public List<Refund> getRefundsByOrderId(String orderId) {
        return refundRepository.findByOrderId(orderId);
    }

    /**
     * Get refunds by customer ID
     */
    public List<Refund> getRefundsByCustomerId(String customerId) {
        return refundRepository.findByCustomerId(customerId);
    }

    /**
     * Update refund status (called by webhook or scheduled job)
     */
    @Transactional
    public void updateRefundStatus(String razorpayRefundId, String status) {
        Refund refund = refundRepository.findByRazorpayRefundId(razorpayRefundId)
                .orElseThrow(() -> new RuntimeException("Refund not found: " + razorpayRefundId));

        Refund.RefundStatus newStatus;
        if ("processed".equalsIgnoreCase(status)) {
            newStatus = Refund.RefundStatus.PROCESSED;
            refund.setProcessedAt(LocalDateTime.now());
        } else if ("processing".equalsIgnoreCase(status)) {
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
     * Update transaction status after refund
     */
    private void updateTransactionStatusAfterRefund(Transaction transaction, BigDecimal refundAmount) {
        // Calculate total refunded amount including this refund
        List<Refund> allRefunds = refundRepository.findByTransactionId(transaction.getId());
        BigDecimal totalRefunded = allRefunds.stream()
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        totalRefunded = totalRefunded.add(refundAmount);

        // Update transaction status based on refund amount
        if (totalRefunded.compareTo(transaction.getAmount()) >= 0) {
            transaction.setStatus(Transaction.PaymentStatus.REFUNDED);
        } else {
            transaction.setStatus(Transaction.PaymentStatus.PARTIAL_REFUND);
        }

        transactionRepository.save(transaction);
        log.info("Transaction status updated after refund. Transaction ID: {}, Status: {}",
                 transaction.getId(), transaction.getStatus());
    }
}
