package com.MaSoVa.payment.unit.util;

import com.MaSoVa.payment.util.StoreCurrencyResolver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StoreCurrencyResolverTest {

    @Test
    void clientCurrency_wins_over_countryMapping() {
        assertThat(StoreCurrencyResolver.resolveCurrency("DE", "GBP")).isEqualTo("GBP");
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
            "DE, EUR",
            "FR, EUR",
            "IT, EUR",
            "NL, EUR",
            "BE, EUR",
            "HU, HUF",
            "LU, EUR",
            "IE, EUR",
            "CH, CHF",
            "GB, GBP",
            "US, USD",
            "CA, CAD",
            "ES, EUR"
    })
    void supported_countries_resolve_when_currency_omitted(String countryCode, String expectedCurrency) {
        assertThat(StoreCurrencyResolver.resolveCurrency(countryCode, null)).isEqualTo(expectedCurrency);
        assertThat(StoreCurrencyResolver.resolveCurrency(countryCode, "  ")).isEqualTo(expectedCurrency);
    }

    @Test
    void unknown_country_throws() {
        assertThatThrownBy(() -> StoreCurrencyResolver.resolveCurrency("XX", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported country code");
    }

    @Test
    void missing_country_when_currency_omitted_throws() {
        assertThatThrownBy(() -> StoreCurrencyResolver.resolveCurrency(null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("countryCode is required");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void blank_country_when_currency_omitted_throws(String blank) {
        assertThatThrownBy(() -> StoreCurrencyResolver.resolveCurrency(blank, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("countryCode is required");
    }

    @Test
    void normalises_currency_case() {
        assertThat(StoreCurrencyResolver.resolveCurrency("GB", "gbp")).isEqualTo("GBP");
    }
}
