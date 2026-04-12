package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.GatewayPaymentRequest;
import com.MaSoVa.payment.gateway.GatewayPaymentResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.razorpay.Payment;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
 * Global-4: Gateway resolved from store.countryCode — Razorpay for India, Stripe for EU/global.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final TransactionRepository transactionRepository;
    private final PaymentGatewayResolver gatewayResolver;
    private final RazorpayService razorpayService;  // kept for verifyPayment Razorpay-specific fetchPayment
    private final OrderServiceClient orderServiceClient;
    private final PiiEncryptionService encryptionService;
    private final PaymentNotificationService paymentNotificationService;
    private final com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher;

    public PaymentService(TransactionRepository transactionRepository,
                          PaymentGatewayResolver gatewayResolver,
                          RazorpayService razorpayService,
                          OrderServiceClient orderServiceClient,
                          PiiEncryptionService encryptionService,
                          PaymentNotificationService paymentNotificationService,
                          com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher) {
        this.transactionRepository = transactionRepository;
        this.gatewayResolver = gatewayResolver;
        this.razorpayService = razorpayService;
        this.orderServiceClient = orderServiceClient;
        this.encryptionService = encryptionService;
        this.paymentNotificationService = paymentNotificationService;
        this.paymentEventPublisher = paymentEventPublisher;
    }

    /**
     * Initiate payment — resolved to Razorpay (India) or Stripe (EU/global) via countryCode.
     */
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        try {
            log.info("Initiating payment for order: {}, amount: {}, orderType: {}, paymentMethod: {}, countryCode: {}",
                     request.getOrderId(), request.getAmount(), request.getOrderType(),
                     request.getPaymentMethod(), request.getCountryCode());

            // Validate payment method based on order type
            if ("DELIVERY".equals(request.getOrderType()) && "CASH".equals(request.getPaymentMethod())) {
                log.error("CASH payment not allowed for DELIVERY orders. Order: {}", request.getOrderId());
                throw new IllegalArgumentException("Cash payment is not allowed for delivery orders. Please use online payment methods.");
            }

            // Check if payment already exists for this order
            Optional<Transaction> existingTransaction = transactionRepository.findByOrderId(request.getOrderId());
            if (existingTransaction.isPresent()) {
                Transaction existing = existingTransaction.get();
                if (existing.getStatus() == Transaction.PaymentStatus.SUCCESS) {
                    log.warn("Payment already completed for order: {}", request.getOrderId());
                    throw new RuntimeException("Payment already completed for this order");
                }
                log.info("Returning existing transaction for order: {}, status: {}", request.getOrderId(), existing.getStatus());
                return PaymentResponse.builder()
                        .transactionId(existing.getId())
                        .orderId(existing.getOrderId())
                        .razorpayOrderId(existing.getRazorpayOrderId())
                        .amount(existing.getAmount())
                        .currency(existing.getCurrency())
                        .status(existing.getStatus())
                        .paymentGateway(existing.getPaymentGateway())
                        .build();
            }

            // Resolve gateway from countryCode (null = India = Razorpay, non-null = Stripe)
            PaymentGateway gateway = gatewayResolver.resolve(request.getCountryCode());

            String receipt = "RCP_" + UUID.randomUUID().toString().substring(0, 8);
            String currency = resolveCurrencyFromCountryCode(request.getCountryCode());

            GatewayPaymentRequest gatewayReq = new GatewayPaymentRequest(
                    request.getOrderId(), request.getAmount(), currency,
                    request.getCustomerEmail(), request.getCustomerPhone(),
                    request.getCustomerId(), receipt);

            GatewayPaymentResult gatewayResult = gateway.initiatePayment(gatewayReq);

            // Create transaction record with encrypted PII (GDPR compliance)
            Transaction transaction = Transaction.builder()
                    .orderId(request.getOrderId())
                    .razorpayOrderId(gatewayResult.getGatewayOrderId()) // PI ID for Stripe, order ID for Razorpay
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerId(request.getCustomerId())
                    .customerEmail(encryptionService.encrypt(request.getCustomerEmail()))
                    .customerPhone(encryptionService.encrypt(request.getCustomerPhone()))
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency(currency)
                    .reconciled(false)
                    .build();

            transaction.setPaymentGateway(gatewayResult.getGatewayName());
            if ("STRIPE".equals(gatewayResult.getGatewayName())) {
                transaction.setStripePaymentIntentId(gatewayResult.getGatewayOrderId());
            }

            transaction = Objects.requireNonNull(transactionRepository.save(transaction));

            log.info("Payment initiated successfully. Transaction ID: {}, Gateway: {}, Gateway Order ID: {}",
                     transaction.getId(), gatewayResult.getGatewayName(), gatewayResult.getGatewayOrderId());

            return PaymentResponse.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .razorpayOrderId(transaction.getRazorpayOrderId())
                    .amount(transaction.getAmount())
                    .status(transaction.getStatus())
                    .customerId(transaction.getCustomerId())
                    .customerEmail(request.getCustomerEmail())
                    .customerPhone(request.getCustomerPhone())
                    .storeId(transaction.getStoreId())
                    .currency(transaction.getCurrency())
                    .createdAt(transaction.getCreatedAt())
                    .paymentGateway(gatewayResult.getGatewayName())
                    .stripeClientSecret(gatewayResult.getClientSecret())
                    .stripePublishableKey(gatewayResult.getPublishableKey())
                    .razorpayKeyId(
                        "RAZORPAY".equals(gatewayResult.getGatewayName())
                            ? gatewayResult.getPublishableKey() : null)
                    .build();

        } catch (Exception e) {
            log.error("Error initiating payment for order: {}", request.getOrderId(), e);
            throw new RuntimeException("Failed to initiate payment: " + e.getMessage(), e);
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
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Transaction not found for order: " + request.getRazorpayOrderId()));

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

            // Resolve gateway: Stripe if paymentGateway is STRIPE, else Razorpay
            PaymentGateway gateway = gatewayResolver.resolve(
                    "STRIPE".equals(transaction.getPaymentGateway()) ? "STRIPE" : null);

            boolean isValid = gateway.confirmPayment(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());

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
                        transaction.getPaymentGateway()));

                throw new RuntimeException("Payment signature verification failed");
            }

            // Update transaction
            transaction.setRazorpayPaymentId(request.getRazorpayPaymentId());
            transaction.setRazorpaySignature(request.getRazorpaySignature());
            transaction.setStatus(Transaction.PaymentStatus.SUCCESS);
            transaction.setPaidAt(LocalDateTime.now());

            // Set payment method — Razorpay fetches from API, Stripe is set from callback
            if (request.getPaymentMethod() != null) {
                try {
                    transaction.setPaymentMethod(
                            Transaction.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
                    );
                } catch (IllegalArgumentException e) {
                    transaction.setPaymentMethod(Transaction.PaymentMethod.OTHER);
                }
            } else if ("RAZORPAY".equals(transaction.getPaymentGateway()) || transaction.getPaymentGateway() == null) {
                // Try to get from Razorpay payment object
                try {
                    Payment payment = razorpayService.fetchPayment(request.getRazorpayPaymentId());
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
                } catch (RazorpayException e) {
                    log.warn("Could not fetch Razorpay payment details for: {}", request.getRazorpayPaymentId(), e);
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
                    transaction.getAmount(), transaction.getCurrency() != null ? transaction.getCurrency() : "INR",
                    methodName, transaction.getRazorpayPaymentId(),
                    transaction.getPaymentGateway(), methodName));

            return buildPaymentResponse(transaction);

        } catch (Exception e) {
            log.error("Error verifying payment", e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage(), e);
        }
    }

    /**
     * Get transaction by ID
     */
    public PaymentResponse getTransaction(String transactionId) {
        Transaction transaction = transactionRepository.findById(Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + transactionId));
        return buildPaymentResponse(transaction);
    }

    /**
     * Get transactions by order ID
     */
    public PaymentResponse getTransactionByOrderId(String orderId) {
        Transaction transaction = transactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found for order: " + orderId));
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + transactionId));

        transaction.setReconciled(true);
        transaction.setReconciledAt(LocalDateTime.now());
        transaction.setReconciledBy(reconciledBy);

        transactionRepository.save(transaction);
        log.info("Transaction {} marked as reconciled by {}", transactionId, reconciledBy);
    }

    /**
     * Record a CASH payment as SUCCESS
     * Used for POS/walk-in orders where payment is collected immediately
     */
    @Transactional
    public PaymentResponse recordCashPayment(InitiatePaymentRequest request) {
        try {
            log.info("Recording cash payment for order: {}, amount: {}, orderType: {}",
                     request.getOrderId(), request.getAmount(), request.getOrderType());

            if ("DELIVERY".equals(request.getOrderType())) {
                log.error("CASH payment not allowed for DELIVERY orders. Order: {}", request.getOrderId());
                throw new IllegalArgumentException("Cash payment is not allowed for delivery orders. Please use online payment methods.");
            }

            Optional<Transaction> existingTransaction = transactionRepository.findByOrderId(request.getOrderId());
            if (existingTransaction.isPresent()) {
                log.warn("Transaction already exists for order: {}", request.getOrderId());
                return buildPaymentResponse(existingTransaction.get());
            }

            String receipt = "CASH_" + UUID.randomUUID().toString().substring(0, 8);

            Transaction transaction = Transaction.builder()
                    .orderId(request.getOrderId())
                    .razorpayOrderId("CASH_" + request.getOrderId())
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .customerId(request.getCustomerId())
                    .customerEmail(encryptionService.encrypt(request.getCustomerEmail()))
                    .customerPhone(encryptionService.encrypt(request.getCustomerPhone()))
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency("INR")
                    .reconciled(false)
                    .build();

            transaction.setPaymentMethod(Transaction.PaymentMethod.CASH);
            transaction.setPaymentGateway("RAZORPAY");
            transaction.setPaidAt(LocalDateTime.now());

            transaction = Objects.requireNonNull(transactionRepository.save(transaction));

            log.info("Cash payment recorded successfully. Transaction ID: {}", transaction.getId());

            try {
                orderServiceClient.updateOrderPaymentStatus(
                        transaction.getOrderId(),
                        "PAID",
                        transaction.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to update order payment status, but cash transaction recorded: {}", e.getMessage());
            }

            paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
                    transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                    transaction.getAmount(), "INR", "CASH", transaction.getId(),
                    "RAZORPAY", "CASH"));

            return buildPaymentResponse(transaction);

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
                .build();
    }

    private String resolveCurrencyFromCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return "INR";
        return switch (countryCode.toUpperCase()) {
            case "DE", "FR", "IT", "NL", "BE", "LU", "IE" -> "EUR";
            case "HU" -> "HUF";
            case "CH" -> "CHF";
            case "GB" -> "GBP";
            case "US" -> "USD";
            case "CA" -> "CAD";
            default   -> "INR";
        };
    }
}
