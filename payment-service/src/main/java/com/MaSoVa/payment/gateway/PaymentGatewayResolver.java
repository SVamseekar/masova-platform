package com.MaSoVa.payment.gateway;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct PaymentGateway based on store.countryCode.
 *
 * Routing rule (stable dual-market):
 *   null, blank, or {@code IN} → RazorpayGateway  (India legacy + explicit IN)
 *   any other ISO code (e.g. DE) → StripeGateway (EU / global)
 *
 * EU demo stores must set {@code countryCode=DE} (etc.). Do not leave EU stores null
 * or they will hit Razorpay. Razorpay may still be disabled via {@code razorpay.enabled=false}
 * for local EU-only boots without India keys.
 *
 * Country is set once at store creation and immutable after first order.
 */
@Component
public class PaymentGatewayResolver {

    private final RazorpayGateway razorpayGateway;
    private final StripeGateway stripeGateway;

    public PaymentGatewayResolver(RazorpayGateway razorpayGateway, StripeGateway stripeGateway) {
        this.razorpayGateway = razorpayGateway;
        this.stripeGateway   = stripeGateway;
    }

    /** India legacy: null, blank, or explicit {@code IN} → Razorpay. */
    public boolean isIndiaStore(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return true;
        }
        return "IN".equalsIgnoreCase(countryCode.trim());
    }

    /**
     * @param countryCode ISO 3166-1 alpha-2 from Store; null/blank treated as India.
     */
    public PaymentGateway resolve(String countryCode) {
        if (isIndiaStore(countryCode)) {
            return razorpayGateway;
        }
        return stripeGateway;
    }
}


