package com.MaSoVa.payment.service;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.GatewayPaymentRequest;
import com.MaSoVa.payment.gateway.GatewayPaymentResult;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.util.StoreCurrencyResolver;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.messaging.events.PaymentFailedEvent;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Payment service handling payment initiation, verification, and transaction management.
 *
 * GDPR Compliance: Customer PII (email, phone) is encrypted at rest using AES-256-GCM.
 * NOTIF-003: Payment notifications integrated for success/failure events.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final TransactionRepository transactionRepository;
    private final RazorpayService razorpayService;
    private final OrderServiceClient orderServiceClient;
    private final RazorpayConfig razorpayConfig;
    private final PiiEncryptionService encryptionService;
    private final PaymentNotificationService paymentNotificationService;
    private final com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher;
    private final PaymentGatewayResolver paymentGatewayResolver;

    public PaymentService(TransactionRepository transactionRepository, RazorpayService razorpayService,
                         OrderServiceClient orderServiceClient, RazorpayConfig razorpayConfig,
                         PiiEncryptionService encryptionService,
                         PaymentNotificationService paymentNotificationService,
                         com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher,
                         PaymentGatewayResolver paymentGatewayResolver) {
        this.transactionRepository = transactionRepository;
        this.razorpayService = razorpayService;
        this.orderServiceClient = orderServiceClient;
        this.razorpayConfig = razorpayConfig;
        this.encryptionService = encryptionService;
        this.paymentNotificationService = paymentNotificationService;
        this.paymentEventPublisher = paymentEventPublisher;
        this.paymentGatewayResolver = paymentGatewayResolver;
    }

    /**
     * Initiate payment - Create Razorpay order
     */
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        try {
            log.info("Initiating payment for order: {}, amount: {}, orderType: {}, paymentMethod: {}, countryCode: {}",
                     request.getOrderId(), request.getAmount(), request.getOrderType(), request.getPaymentMethod(),
                     request.getCountryCode());

            // Validate payment method based on order type
            if ("DELIVERY".equals(request.getOrderType()) && "CASH".equals(request.getPaymentMethod())) {
                log.error("CASH payment not allowed for DELIVERY orders. Order: {}", request.getOrderId());
                throw new IllegalArgumentException("Cash payment is not allowed for delivery orders. Please use online payment methods.");
            }

            // Check if payment already exists for this order
            Optional<Transaction> existingTransaction = transactionRepository.findByOrderId(request.getOrderId());
            if (existingTransaction.isPresent() &&
                existingTransaction.get().getStatus() == Transaction.PaymentStatus.SUCCESS) {
                log.warn("Payment already exists for order: {}", request.getOrderId());
                throw new RuntimeException("Payment already completed for this order");
            }

            PaymentGateway gateway = paymentGatewayResolver.resolve(request.getCountryCode());

            // Generate receipt number
            String receipt = "RCP_" + UUID.randomUUID().toString().substring(0, 8);

            boolean isIndia = paymentGatewayResolver.isIndiaStore(request.getCountryCode());
            String currency = isIndia
                    ? "INR"
                    : StoreCurrencyResolver.resolveCurrency(request.getCountryCode(), request.getCurrency());

            GatewayPaymentResult gatewayResult = gateway.initiatePayment(new GatewayPaymentRequest(
                    request.getOrderId(),
                    request.getAmount(),
                    currency,
                    request.getCustomerEmail(),
                    request.getCustomerPhone(),
                    request.getCustomerId(),
                    receipt
            ));

            // Create transaction record with encrypted PII (GDPR compliance)
            Transaction.Builder builder = Transaction.builder()
                    .orderId(request.getOrderId())
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerId(request.getCustomerId())
                    .customerEmail(encryptionService.encrypt(request.getCustomerEmail()))
                    .customerPhone(encryptionService.encrypt(request.getCustomerPhone()))
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency(currency)
                    .paymentGateway(gatewayResult.getGatewayName())
                    .reconciled(false);

            if ("STRIPE".equals(gatewayResult.getGatewayName())) {
                builder.stripePaymentIntentId(gatewayResult.getGatewayOrderId());
            } else {
                builder.razorpayOrderId(gatewayResult.getGatewayOrderId());
            }

            Transaction transaction = Objects.requireNonNull(transactionRepository.save(builder.build()));

            log.info("Payment initiated successfully. Transaction ID: {}, Gateway: {}, Gateway Order ID: {}",
                     transaction.getId(), gatewayResult.getGatewayName(), gatewayResult.getGatewayOrderId());

            // Build response (return original unencrypted values to client)
            return PaymentResponse.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .razorpayOrderId(transaction.getRazorpayOrderId())
                    .amount(transaction.getAmount())
                    .status(transaction.getStatus())
                    .customerId(transaction.getCustomerId())
                    .customerEmail(request.getCustomerEmail())  // Return original (not encrypted)
                    .customerPhone(request.getCustomerPhone())  // Return original (not encrypted)
                    .storeId(transaction.getStoreId())
                    .currency(transaction.getCurrency())
                    .createdAt(transaction.getCreatedAt())
                    .razorpayKeyId(isIndia ? razorpayConfig.getKeyId() : null) // Public key for frontend
                    .paymentGateway(transaction.getPaymentGateway())
                    .stripeClientSecret(gatewayResult.getClientSecret())
                    .stripePublishableKey(isIndia ? null : gatewayResult.getPublishableKey())
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay error while initiating payment for order: {}", request.getOrderId(), e);
            throw new RuntimeException("Failed to initiate payment: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Error initiating payment for order: {}", request.getOrderId(), e);
            throw e;
        } catch (Exception e) {
            log.error("Error initiating payment for order: {}", request.getOrderId(), e);
            throw new RuntimeException("Failed to initiate payment", e);
        }
    }

    /**
     * Verify and complete payment
     * Week 3 Fix: Added idempotency - prevent duplicate processing
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

            // Stripe transactions confirm via PaymentElement on the frontend + webhook — never via this endpoint
            if ("STRIPE".equals(transaction.getPaymentGateway())) {
                throw new IllegalArgumentException(
                        "Transaction " + transaction.getId() + " uses Stripe — verify via webhook, not /api/payments/verify");
            }

            // IDEMPOTENCY CHECK: If payment already processed successfully, return existing response
            if (transaction.getStatus() == Transaction.PaymentStatus.SUCCESS &&
                request.getRazorpayPaymentId().equals(transaction.getRazorpayPaymentId())) {
                log.info("Payment already verified for transaction: {}. Returning cached response.", transaction.getId());
                return buildPaymentResponse(transaction);
            }

            // Check if payment ID is different but transaction already succeeded
            if (transaction.getStatus() == Transaction.PaymentStatus.SUCCESS) {
                log.warn("Transaction {} already completed with different payment ID. Current: {}, New: {}",
                        transaction.getId(), transaction.getRazorpayPaymentId(), request.getRazorpayPaymentId());
                throw new RuntimeException("Transaction already completed with a different payment ID");
            }

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

                // Send payment failure notification (NOTIF-003)
                String customerEmail = encryptionService.decrypt(transaction.getCustomerEmail());
                String customerPhone = encryptionService.decrypt(transaction.getCustomerPhone());
                paymentNotificationService.sendPaymentFailureNotification(
                        transaction, customerEmail, customerPhone, "Payment verification failed");

                paymentEventPublisher.publishPaymentFailed(new PaymentFailedEvent(
                        transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                        transaction.getAmount(), "Payment signature verification failed",
                        transaction.getPaymentGateway() != null ? transaction.getPaymentGateway() : "UNKNOWN"));

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

            // Send payment success notification (NOTIF-003)
            String customerEmail = encryptionService.decrypt(transaction.getCustomerEmail());
            String customerPhone = encryptionService.decrypt(transaction.getCustomerPhone());
            paymentNotificationService.sendPaymentSuccessNotification(
                    transaction, customerEmail, customerPhone);

            // Publish payment.completed event for analytics + downstream consumers
            String methodName = transaction.getPaymentMethod() != null
                    ? transaction.getPaymentMethod().name() : "UNKNOWN";
            paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
                    transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                    transaction.getAmount(), "INR", methodName, transaction.getRazorpayPaymentId(),
                    transaction.getPaymentGateway() != null ? transaction.getPaymentGateway() : "RAZORPAY",
                    null));

            return buildPaymentResponse(transaction);

        } catch (RazorpayException e) {
            log.error("Razorpay error while verifying payment", e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Error verifying payment", e);
            throw e;
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            throw new RuntimeException("Failed to verify payment", e);
        }
    }

    /**
     * Handle a normalised Stripe webhook event (called by StripeWebhookController after
     * signature verification). Stripe retries webhook delivery, so this must be idempotent.
     */
    @Transactional
    public void handleStripeWebhookEvent(GatewayWebhookResult result) {
        if (result.getGatewayOrderId() == null) {
            log.warn("Stripe webhook event {} has no PaymentIntent ID — ignoring", result.getEventType());
            return;
        }

        Optional<Transaction> transactionOpt = transactionRepository.findByStripePaymentIntentId(result.getGatewayOrderId());
        if (transactionOpt.isEmpty()) {
            log.warn("No transaction found for Stripe PaymentIntent {} — ignoring webhook event {}",
                    result.getGatewayOrderId(), result.getEventType());
            return;
        }
        Transaction transaction = transactionOpt.get();

        switch (result.getEventType()) {
            case PAYMENT_CAPTURED -> handleStripePaymentCaptured(transaction, result);
            case PAYMENT_FAILED -> handleStripePaymentFailed(transaction, result);
            case REFUND_PROCESSED -> {
                transaction.setStatus(Transaction.PaymentStatus.REFUNDED);
                transactionRepository.save(transaction);
                log.info("Stripe refund processed for transaction: {}", transaction.getId());
            }
            case REFUND_FAILED -> log.warn("Stripe refund failed for transaction: {}, reason: {}",
                    transaction.getId(), result.getFailureReason());
            default -> log.info("Unhandled Stripe webhook event type: {} for transaction: {}",
                    result.getEventType(), transaction.getId());
        }
    }

    private void handleStripePaymentCaptured(Transaction transaction, GatewayWebhookResult result) {
        if (transaction.getStatus() == Transaction.PaymentStatus.SUCCESS) {
            log.info("Stripe PaymentIntent {} already processed for transaction: {}. Ignoring duplicate webhook.",
                    result.getGatewayOrderId(), transaction.getId());
            return;
        }

        transaction.setRazorpayPaymentId(result.getGatewayPaymentId()); // reused field holds gateway charge ID
        transaction.setStatus(Transaction.PaymentStatus.SUCCESS);
        transaction.setPaidAt(LocalDateTime.now());
        if (result.getStripeFeeAmountMinor() != null) {
            transaction.setStripeFeeMinorUnits(result.getStripeFeeAmountMinor());
        }
        String methodType = result.getPaymentMethodType() != null ? result.getPaymentMethodType() : "card";
        transaction.setPaymentMethodType(methodType);
        transaction.setPaymentMethod(mapStripeMethodType(methodType));
        transaction = transactionRepository.save(transaction);

        log.info("Stripe payment captured and transaction completed. Transaction ID: {}", transaction.getId());

        orderServiceClient.updateOrderPaymentStatus(transaction.getOrderId(), "PAID", transaction.getId());

        String customerEmail = encryptionService.decrypt(transaction.getCustomerEmail());
        String customerPhone = encryptionService.decrypt(transaction.getCustomerPhone());
        paymentNotificationService.sendPaymentSuccessNotification(transaction, customerEmail, customerPhone);

        paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
                transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                transaction.getAmount(), transaction.getCurrency(), transaction.getPaymentMethod().name(),
                transaction.getStripePaymentIntentId(), "STRIPE", methodType));
    }

    private void handleStripePaymentFailed(Transaction transaction, GatewayWebhookResult result) {
        if (transaction.getStatus() == Transaction.PaymentStatus.FAILED) {
            log.info("Stripe PaymentIntent {} already marked failed for transaction: {}. Ignoring duplicate webhook.",
                    result.getGatewayOrderId(), transaction.getId());
            return;
        }

        transaction.setStatus(Transaction.PaymentStatus.FAILED);
        transaction.setErrorCode("STRIPE_PAYMENT_FAILED");
        transaction.setErrorDescription(result.getFailureReason());
        transactionRepository.save(transaction);

        log.error("Stripe payment failed for transaction: {}, reason: {}", transaction.getId(), result.getFailureReason());

        String customerEmail = encryptionService.decrypt(transaction.getCustomerEmail());
        String customerPhone = encryptionService.decrypt(transaction.getCustomerPhone());
        paymentNotificationService.sendPaymentFailureNotification(
                transaction, customerEmail, customerPhone, result.getFailureReason());

        paymentEventPublisher.publishPaymentFailed(new PaymentFailedEvent(
                transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                transaction.getAmount(), result.getFailureReason(), "STRIPE"));
    }

    /**
     * Get transaction by ID
     */
    public PaymentResponse getTransaction(String transactionId) {
        Transaction transaction = transactionRepository.findById(Objects.requireNonNull(transactionId))
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
    public List<PaymentResponse> getTransactionsByCustomerId(String customerId) {
        return transactionRepository.findByCustomerId(customerId).stream()
                .map(this::buildPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get transactions by store ID
     */
    public List<PaymentResponse> getTransactionsByStoreId(String storeId) {
        return transactionRepository.findByStoreId(storeId).stream()
                .map(this::buildPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
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
        Transaction transaction = transactionRepository.findById(Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        transaction.setReconciled(true);
        transaction.setReconciledAt(LocalDateTime.now());
        transaction.setReconciledBy(reconciledBy);

        transactionRepository.save(transaction);
        log.info("Transaction {} marked as reconciled by {}", transactionId, reconciledBy);
    }

    /**
     * Build PaymentResponse with decrypted PII fields.
     * GDPR Note: PII is stored encrypted in database and decrypted only when needed.
     */
    /**
     * Record a CASH payment as SUCCESS
     * Used for POS/walk-in orders where payment is collected immediately
     */
    @Transactional
    public PaymentResponse recordCashPayment(InitiatePaymentRequest request) {
        try {
            log.info("Recording cash payment for order: {}, amount: {}, orderType: {}",
                     request.getOrderId(), request.getAmount(), request.getOrderType());

            // Validate: Cash payment only allowed for PICKUP/TAKEAWAY orders
            if ("DELIVERY".equals(request.getOrderType())) {
                log.error("CASH payment not allowed for DELIVERY orders. Order: {}", request.getOrderId());
                throw new IllegalArgumentException("Cash payment is not allowed for delivery orders. Please use online payment methods.");
            }

            // Check if payment already exists for this order
            Optional<Transaction> existingTransaction = transactionRepository.findByOrderId(request.getOrderId());
            if (existingTransaction.isPresent()) {
                log.warn("Transaction already exists for order: {}", request.getOrderId());
                return buildPaymentResponse(existingTransaction.get());
            }

            // Generate receipt number
            String receipt = "CASH_" + UUID.randomUUID().toString().substring(0, 8);

            // Create transaction record with SUCCESS status (cash collected immediately)
            Transaction transaction = Transaction.builder()
                    .orderId(request.getOrderId())
                    .razorpayOrderId("CASH_" + request.getOrderId()) // No Razorpay order for cash
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.SUCCESS) // Cash is collected immediately
                    .customerId(request.getCustomerId())
                    .customerEmail(encryptionService.encrypt(request.getCustomerEmail()))
                    .customerPhone(encryptionService.encrypt(request.getCustomerPhone()))
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency("INR")
                    .reconciled(false)
                    .build();

            // Set payment method to CASH
            transaction.setPaymentMethod(Transaction.PaymentMethod.CASH);
            transaction.setPaidAt(LocalDateTime.now());

            transaction = Objects.requireNonNull(transactionRepository.save(transaction));

            log.info("Cash payment recorded successfully. Transaction ID: {}", transaction.getId());

            // Update order payment status
            try {
                orderServiceClient.updateOrderPaymentStatus(
                        transaction.getOrderId(),
                        "PAID",
                        transaction.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to update order payment status, but cash transaction recorded: {}", e.getMessage());
            }

            // Publish payment.completed event for analytics
            paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
                    transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                    transaction.getAmount(), "INR", "CASH", transaction.getId(),
                    "CASH", null));

            return buildPaymentResponse(transaction);

        } catch (RuntimeException e) {
            log.error("Error recording cash payment", e);
            throw e;
        } catch (Exception e) {
            log.error("Error recording cash payment", e);
            throw new RuntimeException("Failed to record cash payment", e);
        }
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
                .customerEmail(encryptionService.decrypt(transaction.getCustomerEmail()))
                .customerPhone(encryptionService.decrypt(transaction.getCustomerPhone()))
                .storeId(transaction.getStoreId())
                .currency(transaction.getCurrency())
                .createdAt(transaction.getCreatedAt())
                .paidAt(transaction.getPaidAt())
                .paymentGateway(transaction.getPaymentGateway())
                .stripeFeeMinorUnits(transaction.getStripeFeeMinorUnits())
                .paymentMethodType(transaction.getPaymentMethodType())
                .build();
    }

    private static Transaction.PaymentMethod mapStripeMethodType(String methodType) {
        if (methodType == null) {
            return Transaction.PaymentMethod.CARD;
        }
        return switch (methodType.toLowerCase()) {
            case "card" -> Transaction.PaymentMethod.CARD;
            case "upi" -> Transaction.PaymentMethod.UPI;
            case "netbanking" -> Transaction.PaymentMethod.NETBANKING;
            case "wallet" -> Transaction.PaymentMethod.WALLET;
            default -> Transaction.PaymentMethod.OTHER;
        };
    }

    /**
     * Anonymise all PII in transactions for a customer (GDPR erasure).
     * Called internally by core-service GDPR service via POST /api/payments/gdpr/anonymize.
     */
    @org.springframework.transaction.annotation.Transactional
    public void anonymizeCustomerData(String customerId) {
        List<Transaction> transactions = transactionRepository.findByCustomerId(customerId);
        for (Transaction tx : transactions) {
            tx.setCustomerEmail(encryptionService.encrypt("ANONYMIZED"));
            tx.setCustomerPhone(encryptionService.encrypt("ANONYMIZED"));
            transactionRepository.save(tx);
        }
        log.info("Anonymised {} transactions for customer {}", transactions.size(), customerId);
    }
}
