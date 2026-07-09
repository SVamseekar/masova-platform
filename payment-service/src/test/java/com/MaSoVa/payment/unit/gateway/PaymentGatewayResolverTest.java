package com.MaSoVa.payment.unit.gateway;

import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.gateway.RazorpayGateway;
import com.MaSoVa.payment.gateway.StripeGateway;
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
    void null_countryCode_returns_razorpay_india_legacy() {
        assertThat(resolver.resolve(null)).isSameAs(razorpayGateway);
    }

    @Test
    void empty_countryCode_returns_razorpay_india_legacy() {
        assertThat(resolver.resolve("")).isSameAs(razorpayGateway);
    }

    @Test
    void in_countryCode_returns_razorpay() {
        assertThat(resolver.resolve("IN")).isSameAs(razorpayGateway);
        assertThat(resolver.resolve("in")).isSameAs(razorpayGateway);
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

    @Test
    void resolveByGatewayName_stripe() {
        assertThat(resolver.resolveByGatewayName("STRIPE")).isSameAs(stripeGateway);
        assertThat(resolver.resolveByGatewayName("stripe")).isSameAs(stripeGateway);
    }

    @Test
    void resolveByGatewayName_razorpay_default() {
        assertThat(resolver.resolveByGatewayName("RAZORPAY")).isSameAs(razorpayGateway);
        assertThat(resolver.resolveByGatewayName(null)).isSameAs(razorpayGateway);
        assertThat(resolver.resolveByGatewayName("CASH")).isSameAs(razorpayGateway);
    }
}
