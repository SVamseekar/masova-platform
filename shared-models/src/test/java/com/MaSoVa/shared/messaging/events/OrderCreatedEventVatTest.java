package com.MaSoVa.shared.messaging.events;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

class OrderCreatedEventVatTest {

    @Test
    void orderCreatedEvent_carries_vatCountryCode_and_totalVatAmount() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-1", "customer-1", "store-de-001",
            "DINE_IN", new BigDecimal("119.00"), "EUR"
        );
        event.setVatCountryCode("DE");
        event.setTotalVatAmount(new BigDecimal("19.00"));

        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }

    @Test
    void orderCreatedEvent_vatFields_are_null_by_default() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-2", "customer-2", "store-001",
            "TAKEAWAY", new BigDecimal("200.00"), "INR"
        );
        assertThat(event.getVatCountryCode()).isNull();
        assertThat(event.getTotalVatAmount()).isNull();
    }

    @Test
    void orderStatusChangedEvent_carries_vatCountryCode() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-1", "customer-1", "RECEIVED", "PREPARING", "store-de-001"
        );
        event.setVatCountryCode("DE");
        event.setTotalVatAmount(new BigDecimal("19.00"));

        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }
}
