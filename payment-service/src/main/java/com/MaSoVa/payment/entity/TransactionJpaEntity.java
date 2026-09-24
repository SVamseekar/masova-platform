package com.MaSoVa.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transactions", schema = "payment_schema")
@Getter
@Setter
@NoArgsConstructor
public class TransactionJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "mongo_id", length = 36, unique = true)
    private String mongoId;

    @Column(name = "order_id", length = 36)
    private String orderId;

    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "customer_id", length = 36)
    private String customerId;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "store_id", nullable = false, length = 36)
    private String storeId;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_description")
    private String errorDescription;

    @Column(name = "error_source", length = 100)
    private String errorSource;

    @Column(name = "error_step", length = 100)
    private String errorStep;

    @Column(name = "error_reason")
    private String errorReason;

    @Column(name = "receipt", length = 100)
    private String receipt;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "reconciled", nullable = false)
    private boolean reconciled;

    @Column(name = "reconciled_at")
    private OffsetDateTime reconciledAt;

    @Column(name = "reconciled_by", length = 36)
    private String reconciledBy;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "payment_gateway", length = 20)
    private String paymentGateway;

    @Column(name = "stripe_payment_intent_id", length = 100)
    private String stripePaymentIntentId;

    @Column(name = "stripe_fee_minor_units")
    private Long stripeFeeMinorUnits;
}
