package com.MaSoVa.core.store.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.*;

class CountryProfileServiceTest {

    private CountryProfileService service;

    @BeforeEach
    void setUp() {
        service = new CountryProfileService();
    }

    @ParameterizedTest(name = "{0} -> currency={1}, locale={2}")
    @CsvSource({
        "DE, EUR, de-DE",
        "FR, EUR, fr-FR",
        "IT, EUR, it-IT",
        "NL, EUR, nl-NL",
        "BE, EUR, nl-BE",
        "HU, HUF, hu-HU",
        "LU, EUR, lb-LU",
        "IE, EUR, en-IE",
        "CH, CHF, de-CH",
        "GB, GBP, en-GB",
        "US, USD, en-US",
        "CA, CAD, en-CA"
    })
    void resolveCurrencyAndLocale_knownCountry(String countryCode, String expectedCurrency, String expectedLocale) {
        assertThat(service.resolveCurrency(countryCode)).isEqualTo(expectedCurrency);
        assertThat(service.resolveLocale(countryCode)).isEqualTo(expectedLocale);
    }

    @Test
    void resolveCurrency_nullCountryCode_returnsINR() {
        assertThat(service.resolveCurrency(null)).isEqualTo("INR");
    }

    @Test
    void resolveLocale_nullCountryCode_returnsEnIN() {
        assertThat(service.resolveLocale(null)).isEqualTo("en-IN");
    }

    @Test
    void resolveCurrency_unknownCountryCode_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.resolveCurrency("XX"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("XX");
    }

    @Test
    void resolveLocale_unknownCountryCode_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.resolveLocale("ZZ"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("ZZ");
    }
}
