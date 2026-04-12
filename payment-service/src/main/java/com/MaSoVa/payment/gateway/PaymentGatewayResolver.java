package com.MaSoVa.payment.gateway;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct PaymentGateway based on store.countryCode.
 *
 * Routing rule:
 *   null or blank countryCode  →  RazorpayGateway  (India legacy)
 *   any non-blank countryCode  →  StripeGateway     (Global programme)
 *
 * Country is set once at store creation and immutable after first order — routing is stable.
 */
@Component
public class PaymentGatewayResolver {

    private final RazorpayGateway razorpayGateway;
    private final StripeGateway stripeGateway;

    public PaymentGatewayResolver(RazorpayGateway razorpayGateway, StripeGateway stripeGateway) {
        this.razorpayGateway = razorpayGateway;
        this.stripeGateway   = stripeGateway;
    }

    /**
     * @param countryCode ISO 3166-1 alpha-2 country code from Store entity, or null for India stores.
     */
    public PaymentGateway resolve(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return razorpayGateway;
        }
        return stripeGateway;
    }
}
