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
     * Initiate refund
     */
    @Transactional
    public Refund initiateRefund(RefundRequest request) {
        try {
            log.info("Initiating refund for transaction: {}, amount: {}", request.getTransactionId(), request.getAmount());

            // Find transaction
            Transaction transaction = transactionRepository.findById(Objects.requireNonNull(request.getTransactionId()))
                    .orElseThrow(() -> new RuntimeException("Transaction not found: " + request.getTransactionId()));

            // Validate transaction status
            if (transaction.getStatus() != Transaction.PaymentStatus.SUCCESS) {
                throw new RuntimeException("Cannot refund transaction with status: " + transaction.getStatus());
            }

            // Validate refund amount
            if (request.getAmount().compareTo(transaction.getAmount()) > 0) {
                throw new RuntimeException("Refund amount cannot exceed transaction amount");
            }

            // Check for existing refunds
            List<Refund> existingRefunds = refundRepository.findByTransactionId(request.getTransactionId());
            BigDecimal totalRefunded = existingRefunds.stream()
                    .filter(r -> r.getStatus() == Refund.RefundStatus.PROCESSED)
                    .map(Refund::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal availableForRefund = transaction.getAmount().subtract(totalRefunded);
            if (request.getAmount().compareTo(availableForRefund) > 0) {
                throw new RuntimeException("Refund amount exceeds available amount. Available: " + availableForRefund);
            }

            // Create refund in Razorpay
            String speed = request.getSpeed() != null ? request.getSpeed() : "normal";
            JSONObject razorpayRefund = razorpayService.createRefund(
                    transaction.getRazorpayPaymentId(),
                    request.getAmount(),
                    speed
            );

            // Create refund record
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

            // Check Razorpay refund status
            String razorpayStatus = razorpayRefund.getString("status");
            if ("processed".equalsIgnoreCase(razorpayStatus)) {
                refund.setStatus(Refund.RefundStatus.PROCESSED);
                refund.setProcessedAt(LocalDateTime.now());
            } else if ("processing".equalsIgnoreCase(razorpayStatus)) {
                refund.setStatus(Refund.RefundStatus.PROCESSING);
            }

            refund = Objects.requireNonNull(refundRepository.save(refund));

            // Update transaction status
            updateTransactionStatusAfterRefund(transaction, request.getAmount());

            // Update order refund status
            orderServiceClient.updateOrderPaymentStatus(
                    transaction.getOrderId(),
                    "REFUNDED",
                    transaction.getId()
            );

            log.info("Refund initiated successfully. Refund ID: {}, Razorpay Refund ID: {}",
                     refund.getId(), refund.getRazorpayRefundId());

            return refund;

        } catch (RazorpayException e) {
            log.error("Razorpay error while initiating refund", e);
            throw new RuntimeException("Failed to initiate refund: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error initiating refund", e);
            throw new RuntimeException("Failed to initiate refund", e);
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
