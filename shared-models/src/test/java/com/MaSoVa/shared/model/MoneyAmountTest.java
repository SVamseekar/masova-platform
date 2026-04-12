package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class MoneyAmountTest {

    @Test
    void ofMinorUnits_storesAmountAndCurrency() {
        MoneyAmount money = MoneyAmount.ofMinorUnits(1999L, "EUR");
        assertThat(money.getAmountMinorUnits()).isEqualTo(1999L);
        assertThat(money.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void ofMinorUnits_india_inr() {
        MoneyAmount money = MoneyAmount.ofMinorUnits(29900L, "INR");
        assertThat(money.getCurrency()).isEqualTo("INR");
        assertThat(money.getAmountMinorUnits()).isEqualTo(29900L);
    }

    @Test
    void nullCurrency_throwsIllegalArgument() {
        assertThatThrownBy(() -> MoneyAmount.ofMinorUnits(100L, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("currency");
    }

    @Test
    void negativeAmount_throwsIllegalArgument() {
        assertThatThrownBy(() -> MoneyAmount.ofMinorUnits(-1L, "EUR"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("amount");
    }

    @Test
    void equals_sameAmountAndCurrency() {
        MoneyAmount a = MoneyAmount.ofMinorUnits(500L, "GBP");
        MoneyAmount b = MoneyAmount.ofMinorUnits(500L, "GBP");
        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    void equals_differentCurrency_notEqual() {
        MoneyAmount eur = MoneyAmount.ofMinorUnits(500L, "EUR");
        MoneyAmount gbp = MoneyAmount.ofMinorUnits(500L, "GBP");
        assertThat(eur).isNotEqualTo(gbp);
    }
}
