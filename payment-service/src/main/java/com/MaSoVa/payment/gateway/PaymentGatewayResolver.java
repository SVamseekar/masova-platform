package com.MaSoVa.payment.gateway;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct PaymentGateway based on store.countryCode.
 *
 * EU-primary routing (2026-07):
 *   explicit {@code IN}           → RazorpayGateway (India only)
 *   null, blank, or any other ISO → StripeGateway   (EU / global default)
 *
 * Country is set once at store creation and immutable after first order — routing is stable.
 * Demo/Berlin stores must use countryCode=DE (or similar) so Stripe is used.
 */
@Component
public class PaymentGatewayResolver {

    private final RazorpayGateway razorpayGateway;
    private final StripeGateway stripeGateway;

    public PaymentGatewayResolver(RazorpayGateway razorpayGateway, StripeGateway stripeGateway) {
        this.razorpayGateway = razorpayGateway;
        this.stripeGateway   = stripeGateway;
    }

    /** India only when countryCode is explicitly {@code IN}. Everything else is Stripe (EU-primary). */
    public boolean isIndiaStore(String countryCode) {
        return countryCode != null && "IN".equalsIgnoreCase(countryCode.trim());
    }

    /**
     * @param countryCode ISO 3166-1 alpha-2 from Store, or null/blank → Stripe (EU default).
     */
    public PaymentGateway resolve(String countryCode) {
        if (isIndiaStore(countryCode)) {
            return razorpayGateway;
        }
        return stripeGateway;
    }
}

