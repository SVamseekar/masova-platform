package com.MaSoVa.payment.service;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final RazorpayService razorpayService;
    private final OrderServiceClient orderServiceClient;
    private final RazorpayConfig razorpayConfig;

    /**
     * Initiate payment - Create Razorpay order
     */
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        try {
            log.info("Initiating payment for order: {}, amount: {}", request.getOrderId(), request.getAmount());

            // Check if payment already exists for this order
            Optional<Transaction> existingTransaction = transactionRepository.findByOrderId(request.getOrderId());
            if (existingTransaction.isPresent() &&
                existingTransaction.get().getStatus() == Transaction.PaymentStatus.SUCCESS) {
                log.warn("Payment already exists for order: {}", request.getOrderId());
                throw new RuntimeException("Payment already completed for this order");
            }

            // Generate receipt number
            String receipt = "RCP_" + UUID.randomUUID().toString().substring(0, 8);

            // Create Razorpay order
            Order razorpayOrder = razorpayService.createOrder(request.getAmount(), request.getOrderId(), receipt);

            // Create transaction record
            Transaction transaction = Transaction.builder()
                    .orderId(request.getOrderId())
                    .razorpayOrderId(razorpayOrder.get("id"))
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerId(request.getCustomerId())
                    .customerEmail(request.getCustomerEmail())
                    .customerPhone(request.getCustomerPhone())
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency("INR")
                    .reconciled(false)
                    .build();

            transaction = transactionRepository.save(transaction);

            log.info("Payment initiated successfully. Transaction ID: {}, Razorpay Order ID: {}",
                     transaction.getId(), transaction.getRazorpayOrderId());

            // Build response
            return PaymentResponse.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .razorpayOrderId(transaction.getRazorpayOrderId())
                    .amount(transaction.getAmount())
                    .status(transaction.getStatus())
                    .customerId(transaction.getCustomerId())
                    .customerEmail(transaction.getCustomerEmail())
                    .customerPhone(transaction.getCustomerPhone())
                    .storeId(transaction.getStoreId())
                    .currency(transaction.getCurrency())
                    .createdAt(transaction.getCreatedAt())
                    .razorpayKeyId(razorpayConfig.getKeyId()) // Public key for frontend
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay error while initiating payment for order: {}", request.getOrderId(), e);
            throw new RuntimeException("Failed to initiate payment: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error initiating payment for order: {}", request.getOrderId(), e);
            throw new RuntimeException("Failed to initiate payment", e);
        }
    }

    /**
     * Verify and complete payment
     */
    @Transactional
    public PaymentResponse verifyPayment(PaymentCallbackRequest request) {
        try {
            log.info("Verifying payment. Razorpay Order ID: {}, Payment ID: {}",
                     request.getRazorpayOrderId(), request.getRazorpayPaymentId());

            // Find transaction
            Transaction transaction = transactionRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new RuntimeException("Transaction not found for Razorpay order: " +
                                                            request.getRazorpayOrderId()));

            // Verify signature
            boolean isValid = razorpayService.verifyPaymentSignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature()
            );

            if (!isValid) {
                log.error("Payment signature verification failed for transaction: {}", transaction.getId());
                transaction.setStatus(Transaction.PaymentStatus.FAILED);
                transaction.setErrorCode("SIGNATURE_VERIFICATION_FAILED");
                transaction.setErrorDescription("Payment signature verification failed");
                transactionRepository.save(transaction);

                throw new RuntimeException("Payment signature verification failed");
            }

            // Fetch payment details from Razorpay
            Payment payment = razorpayService.fetchPayment(request.getRazorpayPaymentId());

            // Update transaction
            transaction.setRazorpayPaymentId(request.getRazorpayPaymentId());
            transaction.setRazorpaySignature(request.getRazorpaySignature());
            transaction.setStatus(Transaction.PaymentStatus.SUCCESS);
            transaction.setPaidAt(LocalDateTime.now());

            // Set payment method
            if (request.getPaymentMethod() != null) {
                try {
                    transaction.setPaymentMethod(
                            Transaction.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
                    );
                } catch (IllegalArgumentException e) {
                    transaction.setPaymentMethod(Transaction.PaymentMethod.OTHER);
                }
            } else {
                // Try to get from Razorpay payment object
                String method = payment.get("method");
                if (method != null) {
                    try {
                        transaction.setPaymentMethod(
                                Transaction.PaymentMethod.valueOf(method.toUpperCase())
                        );
                    } catch (IllegalArgumentException e) {
                        transaction.setPaymentMethod(Transaction.PaymentMethod.OTHER);
                    }
                }
            }

            transaction = transactionRepository.save(transaction);

            log.info("Payment verified and completed successfully. Transaction ID: {}", transaction.getId());

            // Update order payment status
            orderServiceClient.updateOrderPaymentStatus(
                    transaction.getOrderId(),
                    "PAID",
                    transaction.getId()
            );

            return buildPaymentResponse(transaction);

        } catch (RazorpayException e) {
            log.error("Razorpay error while verifying payment", e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            throw new RuntimeException("Failed to verify payment", e);
        }
    }

    /**
     * Get transaction by ID
     */
    public PaymentResponse getTransaction(String transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
        return buildPaymentResponse(transaction);
    }

    /**
     * Get transactions by order ID
     */
    public PaymentResponse getTransactionByOrderId(String orderId) {
        Transaction transaction = transactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + orderId));
        return buildPaymentResponse(transaction);
    }

    /**
     * Get transactions by customer ID
     */
    public List<Transaction> getTransactionsByCustomerId(String customerId) {
        return transactionRepository.findByCustomerId(customerId);
    }

    /**
     * Get transactions by store ID
     */
    public List<Transaction> getTransactionsByStoreId(String storeId) {
        return transactionRepository.findByStoreId(storeId);
    }

    /**
     * Generate daily reconciliation report
     */
    public ReconciliationReportResponse getDailyReconciliation(String storeId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionRepository
                .findByStoreIdAndCreatedAtBetween(storeId, startOfDay, endOfDay);

        // Calculate metrics
        long totalTransactions = transactions.size();
        long successfulTransactions = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.SUCCESS)
                .count();
        long failedTransactions = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.FAILED)
                .count();
        long refundedTransactions = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.REFUNDED ||
                            t.getStatus() == Transaction.PaymentStatus.PARTIAL_REFUND)
                .count();

        BigDecimal totalAmount = transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal successfulAmount = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.SUCCESS)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundedAmount = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.REFUNDED ||
                            t.getStatus() == Transaction.PaymentStatus.PARTIAL_REFUND)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Payment method breakdown
        Map<String, BigDecimal> paymentMethodBreakdown = new HashMap<>();
        transactions.stream()
                .filter(t -> t.getStatus() == Transaction.PaymentStatus.SUCCESS)
                .forEach(t -> {
                    String method = t.getPaymentMethod() != null ?
                                   t.getPaymentMethod().toString() : "UNKNOWN";
                    paymentMethodBreakdown.merge(method, t.getAmount(), BigDecimal::add);
                });

        long unreconciledCount = transactions.stream()
                .filter(t -> !t.isReconciled())
                .count();

        return ReconciliationReportResponse.builder()
                .reportDate(date)
                .storeId(storeId)
                .totalTransactions((int) totalTransactions)
                .successfulTransactions((int) successfulTransactions)
                .failedTransactions((int) failedTransactions)
                .refundedTransactions((int) refundedTransactions)
                .totalAmount(totalAmount)
                .successfulAmount(successfulAmount)
                .refundedAmount(refundedAmount)
                .netAmount(successfulAmount.subtract(refundedAmount))
                .paymentMethodBreakdown(paymentMethodBreakdown)
                .unreconciledCount((int) unreconciledCount)
                .build();
    }

    /**
     * Mark transaction as reconciled
     */
    @Transactional
    public void markAsReconciled(String transactionId, String reconciledBy) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        transaction.setReconciled(true);
        transaction.setReconciledAt(LocalDateTime.now());
        transaction.setReconciledBy(reconciledBy);

        transactionRepository.save(transaction);
        log.info("Transaction {} marked as reconciled by {}", transactionId, reconciledBy);
    }

    private PaymentResponse buildPaymentResponse(Transaction transaction) {
        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .orderId(transaction.getOrderId())
                .razorpayOrderId(transaction.getRazorpayOrderId())
                .razorpayPaymentId(transaction.getRazorpayPaymentId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .paymentMethod(transaction.getPaymentMethod())
                .customerId(transaction.getCustomerId())
                .customerEmail(transaction.getCustomerEmail())
                .customerPhone(transaction.getCustomerPhone())
                .storeId(transaction.getStoreId())
                .currency(transaction.getCurrency())
                .createdAt(transaction.getCreatedAt())
                .paidAt(transaction.getPaidAt())
                .build();
    }
}
