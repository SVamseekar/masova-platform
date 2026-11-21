package com.MaSoVa.payment.client;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("OrderChargeClient order total parsing")
class OrderChargeClientTest {

    @Test
    @DisplayName("rounds a double-built India total to two decimals, half up")
    void roundsTotal() {
        OrderChargeClient.OrderCharge charge = OrderChargeClient.toCharge("o1",
                Map.of("total", 502.025, "currency", "INR"));
        assertThat(charge.amount()).isEqualByComparingTo("502.03");
        assertThat(charge.amount().scale()).isEqualTo(2);
    }

    @Test
    @DisplayName("an order without a currency is an India (INR) order")
    void legacyOrderIsInr() {
        Map<String, Object> order = new HashMap<>();
        order.put("total", 150.07999999999998);
        order.put("currency", null);
        OrderChargeClient.OrderCharge charge = OrderChargeClient.toCharge("o1", order);
        assertThat(charge.currency()).isEqualTo("INR");
        assertThat(charge.amount()).isEqualByComparingTo("150.08");
    }

    @Test
    @DisplayName("an order without a total cannot be charged")
    void missingTotalFails() {
        assertThatThrownBy(() -> OrderChargeClient.toCharge("o1", Map.of("currency", "EUR")))
                .isInstanceOf(IllegalStateException.class);
    }
}
