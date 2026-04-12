package com.MaSoVa.payment.gateway;

import java.math.BigDecimal;

/**
 * Input to PaymentGateway.initiatePayment.
 * Gateway-agnostic: Razorpay and Stripe both receive this.
 */
public class GatewayPaymentRequest {

    private final String orderId;
    private final BigDecimal amount;
    private final String currency;       // ISO 4217, e.g. "INR", "EUR"
    private final String customerEmail;
    private final String customerPhone;
    private final String customerName;
    private final String receipt;        // Receipt number for Razorpay; idempotency key for Stripe

    public GatewayPaymentRequest(String orderId, BigDecimal amount, String currency,
                                  String customerEmail, String customerPhone,
                                  String customerName, String receipt) {
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.customerName = customerName;
        this.receipt = receipt;
    }

    public String getOrderId() { return orderId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public String getCustomerName() { return customerName; }
    public String getReceipt() { return receipt; }
}
