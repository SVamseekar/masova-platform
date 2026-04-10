package com.MaSoVa.commerce.order.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TaxConfigurationTest {

    private TaxConfiguration taxConfig;

    @BeforeEach
    void setUp() {
        taxConfig = new TaxConfiguration();
    }

    @Test
    void defaultGstRate_is_5_percent() {
        assertThat(taxConfig.getDefaultGstPercent()).isEqualTo(5.0);
    }

    @Test
    void maharashtra_state_rate_is_5_percent() {
        assertThat(taxConfig.getTaxRateForState("Maharashtra")).isEqualTo(5.0);
    }

    @Test
    void unknown_state_falls_back_to_default() {
        assertThat(taxConfig.getTaxRateForState("UnknownState")).isEqualTo(5.0);
    }

    @Test
    void null_state_falls_back_to_default() {
        assertThat(taxConfig.getTaxRateForState(null)).isEqualTo(5.0);
    }

    @Test
    void category_FOOD_rate_is_5_percent() {
        assertThat(taxConfig.getTaxRateForCategory("FOOD")).isEqualTo(5.0);
    }

    @Test
    void category_BEVERAGE_rate_is_12_percent() {
        assertThat(taxConfig.getTaxRateForCategory("BEVERAGE")).isEqualTo(12.0);
    }

    @Test
    void null_category_falls_back_to_FOOD_rate() {
        assertThat(taxConfig.getTaxRateForCategory(null)).isEqualTo(5.0);
    }

    @Test
    void calculateTax_on_100_in_maharashtra_returns_5() {
        double tax = taxConfig.calculateTax(100.0, "Maharashtra", true);
        assertThat(tax).isCloseTo(5.0, within(0.001));
    }

    @Test
    void calculateTaxBreakdown_splits_cgst_and_sgst_equally() {
        TaxConfiguration.TaxBreakdown breakdown = taxConfig.calculateTaxBreakdown(200.0, "Maharashtra");
        assertThat(breakdown.getCgst()).isCloseTo(5.0, within(0.001));
        assertThat(breakdown.getSgst()).isCloseTo(5.0, within(0.001));
        assertThat(breakdown.getTotalTax()).isCloseTo(10.0, within(0.001));
        assertThat(breakdown.getTotalPercent()).isEqualTo(5.0);
    }
}
