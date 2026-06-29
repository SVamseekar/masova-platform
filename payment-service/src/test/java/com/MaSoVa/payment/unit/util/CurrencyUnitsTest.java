package com.MaSoVa.payment.unit.util;

import com.MaSoVa.payment.util.CurrencyUnits;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CurrencyUnitsTest {

    @Test
    void eur_usesMinorSubdivision() {
        assertThat(CurrencyUnits.usesMinorSubdivision("EUR")).isTrue();
        assertThat(CurrencyUnits.majorToStripeAmount(new BigDecimal("42.50"), "EUR")).isEqualTo(4250L);
    }

    @Test
    void huf_noMinorSubdivision() {
        assertThat(CurrencyUnits.usesMinorSubdivision("HUF")).isFalse();
        assertThat(CurrencyUnits.majorToStripeAmount(new BigDecimal("2990"), "HUF")).isEqualTo(2990L);
    }

    @Test
    void inr_usesMinorSubdivision() {
        assertThat(CurrencyUnits.majorToStripeAmount(new BigDecimal("299"), "INR")).isEqualTo(29900L);
    }
}