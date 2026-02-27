package com.MaSoVa.shared.test.builders;

import com.MaSoVa.shared.test.MockFactory;
import com.MaSoVa.shared.test.TestDataBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Builder for creating test payment Transaction and Refund data as Map representations.
 *
 * Mirrors the Transaction and Refund entities from the payment-service module.
 *
 * @example
 * <pre>
 * {@code
 * // Pending transaction
 * Map<String, Object> txn = PaymentTestDataBuilder.aTransaction().build();
 *
 * // Successful payment
 * Map<String, Object> txn = PaymentTestDataBuilder.aSuccessfulTransaction().build();
 *
 * // Full refund
 * Map<String, Object> refund = PaymentTestDataBuilder.aRefund().build();
 * }
 * </pre>
 */
public class PaymentTestDataBuilder {

    // --- Transaction fields ---

    private String id = TestDataBuilder.randomId();
    private String orderId = TestDataBuilder.randomId();
    private String razorpayOrderId = MockFactory.mockRazorpayOrderId();
    private String razorpayPaymentId = null;
    private String razorpaySignature = null;
    private BigDecimal amount = BigDecimal.valueOf(25.85);
    private String status = "PENDING";
    private String paymentMethod = null;
    private String customerId = TestDataBuilder.defaultCustomerId();
    private String customerEmail = "customer@example.com";
    private String customerPhone = "+31612345678";
    private String storeId = TestDataBuilder.defaultStoreId();
    private String errorCode = null;
    private String errorDescription = null;
    private String errorSource = null;
    private String errorStep = null;
    private String errorReason = null;
    private String receipt = null;
    private String currency = "INR";
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime paidAt = null;
    private boolean reconciled = false;
    private LocalDateTime reconciledAt = null;
    private String reconciledBy = null;

    private PaymentTestDataBuilder() {}

    public static PaymentTestDataBuilder aTransaction() {
        return new PaymentTestDataBuilder();
    }

    public static PaymentTestDataBuilder anInitiatedTransaction() {
        return new PaymentTestDataBuilder()
                .withStatus("INITIATED");
    }

    public static PaymentTestDataBuilder aSuccessfulTransaction() {
        return new PaymentTestDataBuilder()
                .withStatus("SUCCESS")
                .withRazorpayPaymentId(MockFactory.mockRazorpayPaymentId())
                .withRazorpaySignature(MockFactory.mockRazorpaySignature())
                .withPaymentMethod("CARD")
                .withPaidAt(LocalDateTime.now());
    }

    public static PaymentTestDataBuilder aFailedTransaction() {
        return new PaymentTestDataBuilder()
                .withStatus("FAILED")
                .withErrorCode("BAD_REQUEST_ERROR")
                .withErrorDescription("Payment processing failed")
                .withErrorSource("gateway")
                .withErrorStep("payment_authorization")
                .withErrorReason("insufficient_funds");
    }

    // Builder methods

    public PaymentTestDataBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public PaymentTestDataBuilder withOrderId(String orderId) {
        this.orderId = orderId;
        return this;
    }

    public PaymentTestDataBuilder withRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
        return this;
    }

    public PaymentTestDataBuilder withRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
        return this;
    }

    public PaymentTestDataBuilder withRazorpaySignature(String razorpaySignature) {
        this.razorpaySignature = razorpaySignature;
        return this;
    }

    public PaymentTestDataBuilder withAmount(BigDecimal amount) {
        this.amount = amount;
        return this;
    }

    public PaymentTestDataBuilder withStatus(String status) {
        this.status = status;
        return this;
    }

    public PaymentTestDataBuilder withPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
        return this;
    }

    public PaymentTestDataBuilder withCustomerId(String customerId) {
        this.customerId = customerId;
        return this;
    }

    public PaymentTestDataBuilder withCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
        return this;
    }

    public PaymentTestDataBuilder withCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
        return this;
    }

    public PaymentTestDataBuilder withStoreId(String storeId) {
        this.storeId = storeId;
        return this;
    }

    public PaymentTestDataBuilder withErrorCode(String errorCode) {
        this.errorCode = errorCode;
        return this;
    }

    public PaymentTestDataBuilder withErrorDescription(String errorDescription) {
        this.errorDescription = errorDescription;
        return this;
    }

    public PaymentTestDataBuilder withErrorSource(String errorSource) {
        this.errorSource = errorSource;
        return this;
    }

    public PaymentTestDataBuilder withErrorStep(String errorStep) {
        this.errorStep = errorStep;
        return this;
    }

    public PaymentTestDataBuilder withErrorReason(String errorReason) {
        this.errorReason = errorReason;
        return this;
    }

    public PaymentTestDataBuilder withReceipt(String receipt) {
        this.receipt = receipt;
        return this;
    }

    public PaymentTestDataBuilder withCurrency(String currency) {
        this.currency = currency;
        return this;
    }

    public PaymentTestDataBuilder withPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
        return this;
    }

    public PaymentTestDataBuilder withReconciled(boolean reconciled) {
        this.reconciled = reconciled;
        return this;
    }

    public PaymentTestDataBuilder withReconciledAt(LocalDateTime reconciledAt) {
        this.reconciledAt = reconciledAt;
        return this;
    }

    public PaymentTestDataBuilder withReconciledBy(String reconciledBy) {
        this.reconciledBy = reconciledBy;
        return this;
    }

    public Map<String, Object> build() {
        Map<String, Object> transaction = new HashMap<>();
        transaction.put("id", id);
        transaction.put("orderId", orderId);
        transaction.put("razorpayOrderId", razorpayOrderId);
        transaction.put("amount", amount);
        transaction.put("status", status);
        transaction.put("customerId", customerId);
        transaction.put("customerEmail", customerEmail);
        transaction.put("customerPhone", customerPhone);
        transaction.put("storeId", storeId);
        transaction.put("currency", currency);
        transaction.put("reconciled", reconciled);
        transaction.put("createdAt", createdAt != null ? createdAt.toString() : null);
        transaction.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);

        if (razorpayPaymentId != null) {
            transaction.put("razorpayPaymentId", razorpayPaymentId);
        }
        if (razorpaySignature != null) {
            transaction.put("razorpaySignature", razorpaySignature);
        }
        if (paymentMethod != null) {
            transaction.put("paymentMethod", paymentMethod);
        }
        if (errorCode != null) {
            transaction.put("errorCode", errorCode);
            transaction.put("errorDescription", errorDescription);
            transaction.put("errorSource", errorSource);
            transaction.put("errorStep", errorStep);
            transaction.put("errorReason", errorReason);
        }
        if (receipt != null) {
            transaction.put("receipt", receipt);
        }
        if (paidAt != null) {
            transaction.put("paidAt", paidAt.toString());
        }
        if (reconciledAt != null) {
            transaction.put("reconciledAt", reconciledAt.toString());
        }
        if (reconciledBy != null) {
            transaction.put("reconciledBy", reconciledBy);
        }

        return transaction;
    }

    // --- Refund builder ---

    /**
     * Build a full refund map with sensible defaults.
     */
    public static Map<String, Object> aRefund() {
        return buildRefund(
                TestDataBuilder.randomId(),
                TestDataBuilder.randomId(),
                TestDataBuilder.randomId(),
                TestDataBuilder.defaultStoreId(),
                BigDecimal.valueOf(25.85),
                "INITIATED",
                "FULL",
                "Customer requested cancellation",
                TestDataBuilder.defaultUserId(),
                TestDataBuilder.defaultCustomerId()
        );
    }

    /**
     * Build a processed refund map.
     */
    public static Map<String, Object> aProcessedRefund() {
        Map<String, Object> refund = aRefund();
        refund.put("status", "PROCESSED");
        refund.put("razorpayRefundId", "rfnd_" + TestDataBuilder.randomString(14));
        refund.put("processedAt", LocalDateTime.now().toString());
        return refund;
    }

    /**
     * Build a refund map with specific values.
     */
    public static Map<String, Object> buildRefund(
            String id, String transactionId, String orderId, String storeId,
            BigDecimal amount, String status, String type,
            String reason, String initiatedBy, String customerId) {

        Map<String, Object> refund = new HashMap<>();
        refund.put("id", id);
        refund.put("transactionId", transactionId);
        refund.put("orderId", orderId);
        refund.put("storeId", storeId);
        refund.put("amount", amount);
        refund.put("status", status);
        refund.put("type", type);
        refund.put("reason", reason);
        refund.put("initiatedBy", initiatedBy);
        refund.put("customerId", customerId);
        refund.put("speed", "normal");
        refund.put("createdAt", LocalDateTime.now().toString());
        refund.put("updatedAt", LocalDateTime.now().toString());
        return refund;
    }
}
