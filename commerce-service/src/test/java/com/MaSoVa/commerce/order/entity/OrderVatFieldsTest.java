package com.MaSoVa.commerce.order.entity;

import com.MaSoVa.shared.model.VatBreakdown;
import com.MaSoVa.shared.model.VatLineItem;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class OrderVatFieldsTest {

    @Test
    void new_order_has_null_vatCountryCode_by_default() {
        Order order = new Order();
        assertThat(order.getVatCountryCode()).isNull();
    }

    @Test
    void vatCountryCode_can_be_set() {
        Order order = new Order();
        order.setVatCountryCode("DE");
        assertThat(order.getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void totalNetAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalNetAmount(new BigDecimal("100.00"));
        assertThat(order.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void totalVatAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalVatAmount(new BigDecimal("19.00"));
        assertThat(order.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }

    @Test
    void totalGrossAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalGrossAmount(new BigDecimal("119.00"));
        assertThat(order.getTotalGrossAmount()).isEqualByComparingTo(new BigDecimal("119.00"));
    }

    @Test
    void vatBreakdown_can_be_set_and_retrieved() {
        Order order = new Order();
        VatLineItem line = new VatLineItem("item-1", "Burger", 19.0,
                new BigDecimal("10.00"), new BigDecimal("1.90"), new BigDecimal("11.90"));
        VatBreakdown breakdown = new VatBreakdown("DE", "DINE_IN",
                new BigDecimal("10.00"), new BigDecimal("1.90"), new BigDecimal("11.90"), List.of(line));
        order.setVatBreakdown(breakdown);
        assertThat(order.getVatBreakdown()).isNotNull();
        assertThat(order.getVatBreakdown().getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void india_order_without_vatCountryCode_still_has_tax_field() {
        Order order = new Order();
        order.setTax(new BigDecimal("10.00"));
        assertThat(order.getTax()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(order.getVatCountryCode()).isNull();
    }
}
