package com.MaSoVa.payment.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class PaymentGatewayResolverTest {

    private RazorpayGateway razorpayGateway;
    private StripeGateway stripeGateway;
    private PaymentGatewayResolver resolver;

    @BeforeEach
    void setUp() {
        razorpayGateway = mock(RazorpayGateway.class);
        stripeGateway = mock(StripeGateway.class);
        resolver = new PaymentGatewayResolver(razorpayGateway, stripeGateway);
    }

    @Test
    void null_countryCode_returns_razorpay() {
        assertThat(resolver.resolve(null)).isSameAs(razorpayGateway);
    }

    @Test
    void empty_countryCode_returns_razorpay() {
        assertThat(resolver.resolve("")).isSameAs(razorpayGateway);
    }

    @Test
    void de_returns_stripe() {
        assertThat(resolver.resolve("DE")).isSameAs(stripeGateway);
    }

    @Test
    void gb_returns_stripe() {
        assertThat(resolver.resolve("GB")).isSameAs(stripeGateway);
    }

    @Test
    void us_returns_stripe() {
        assertThat(resolver.resolve("US")).isSameAs(stripeGateway);
    }

    @Test
    void hu_returns_stripe() {
        assertThat(resolver.resolve("HU")).isSameAs(stripeGateway);
    }

    @Test
    void case_insensitive_de_returns_stripe() {
        assertThat(resolver.resolve("de")).isSameAs(stripeGateway);
    }
}
