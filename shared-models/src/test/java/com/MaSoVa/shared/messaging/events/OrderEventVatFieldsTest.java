package com.MaSoVa.shared.messaging.events;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class OrderEventVatFieldsTest {

    @Test
    void orderCreatedEvent_vat_fields_round_trip() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-1", "customer-1", "store-1", "DINE_IN",
            BigDecimal.valueOf(23.80), "EUR");
        event.setVatCountryCode("DE");
        event.setTotalVatAmount(BigDecimal.valueOf(3.80));

        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo("3.80");
        assertThat(event.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void orderCreatedEvent_india_store_vat_fields_null() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-2", "customer-2", "store-2", "TAKEAWAY",
            BigDecimal.valueOf(118.0), "INR");

        assertThat(event.getVatCountryCode()).isNull();
        assertThat(event.getTotalVatAmount()).isNull();
    }

    @Test
    void orderStatusChangedEvent_vat_fields_round_trip() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-1", "customer-1", "RECEIVED", "PREPARING", "store-1");
        event.setVatCountryCode("FR");
        event.setTotalVatAmount(BigDecimal.valueOf(2.20));

        assertThat(event.getVatCountryCode()).isEqualTo("FR");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo("2.20");
    }

    @Test
    void orderStatusChangedEvent_india_store_vat_fields_null() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-2", "customer-2", "RECEIVED", "PREPARING", "store-2");

        assertThat(event.getVatCountryCode()).isNull();
        assertThat(event.getTotalVatAmount()).isNull();
    }

    @Test
    void orderStatusChangedEvent_currency_field_set_and_get() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-3", "customer-3", "PREPARING", "READY", "store-3");
        event.setCurrency("GBP");

        assertThat(event.getCurrency()).isEqualTo("GBP");
    }

    @Test
    void orderStatusChangedEvent_currency_defaults_null_for_india_orders() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-4", "customer-4", "RECEIVED", "PREPARING", "store-4");

        assertThat(event.getCurrency()).isNull();
    }

    @Test
    void orderStatusChangedEvent_json_creator_includes_currency() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "evt-id", "ORDER_STATUS_CHANGED", java.time.Instant.now(),
            "order-5", "customer-5", "RECEIVED", "PREPARING", "store-5",
            "DE", BigDecimal.valueOf(4.50), "EUR");

        assertThat(event.getCurrency()).isEqualTo("EUR");
        assertThat(event.getVatCountryCode()).isEqualTo("DE");
    }
}
