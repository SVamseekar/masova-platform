package com.MaSoVa.commerce.order.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class OrderCurrencyFieldTest {

    @Test
    void new_order_has_null_currency_by_default() {
        Order order = new Order();
        assertThat(order.getCurrency()).isNull();
    }

    @Test
    void currency_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setCurrency("EUR");
        assertThat(order.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void india_order_currency_remains_null() {
        // India stores do not set currency — null signals legacy INR assumption
        Order order = new Order();
        order.setVatCountryCode(null);
        assertThat(order.getCurrency()).isNull();
    }

    @Test
    void orderJpaEntity_currency_can_be_set() {
        OrderJpaEntity jpa = OrderJpaEntity.builder()
                .id("test-id")
                .orderNumber("ORD-001")
                .storeId("store-1")
                .customerName("Test")
                .subtotal(new java.math.BigDecimal("10.00"))
                .total(new java.math.BigDecimal("10.00"))
                .status("RECEIVED")
                .orderType("DINE_IN")
                .currency("GBP")
                .build();
        assertThat(jpa.getCurrency()).isEqualTo("GBP");
    }

    @Test
    void orderJpaEntity_currency_null_for_india_orders() {
        OrderJpaEntity jpa = OrderJpaEntity.builder()
                .id("test-id")
                .orderNumber("ORD-002")
                .storeId("store-1")
                .customerName("Test")
                .subtotal(new java.math.BigDecimal("10.00"))
                .total(new java.math.BigDecimal("10.00"))
                .status("RECEIVED")
                .orderType("DINE_IN")
                .build();
        assertThat(jpa.getCurrency()).isNull();
    }
}
