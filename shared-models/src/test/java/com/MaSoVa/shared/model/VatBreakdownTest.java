package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class VatBreakdownTest {

    @Test
    void totalVatAmount_sums_all_line_items() {
        VatLineItem line1 = new VatLineItem("item-1", "Burger", 19.0, new BigDecimal("100.00"),
                new BigDecimal("19.00"), new BigDecimal("119.00"));
        VatLineItem line2 = new VatLineItem("item-2", "Beer", 19.0, new BigDecimal("50.00"),
                new BigDecimal("9.50"), new BigDecimal("59.50"));

        VatBreakdown breakdown = new VatBreakdown("DE", "DINE_IN",
                new BigDecimal("150.00"), new BigDecimal("28.50"), new BigDecimal("178.50"),
                List.of(line1, line2));

        assertThat(breakdown.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(breakdown.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("28.50"));
        assertThat(breakdown.getTotalGrossAmount()).isEqualByComparingTo(new BigDecimal("178.50"));
    }

    @Test
    void vatLineItem_stores_all_fields() {
        VatLineItem item = new VatLineItem("item-1", "Schnitzel", 19.0,
                new BigDecimal("100.00"), new BigDecimal("19.00"), new BigDecimal("119.00"));
        assertThat(item.getMenuItemId()).isEqualTo("item-1");
        assertThat(item.getItemName()).isEqualTo("Schnitzel");
        assertThat(item.getVatRate()).isEqualTo(19.0);
        assertThat(item.getNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(item.getVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
        assertThat(item.getGrossAmount()).isEqualByComparingTo(new BigDecimal("119.00"));
    }
}
