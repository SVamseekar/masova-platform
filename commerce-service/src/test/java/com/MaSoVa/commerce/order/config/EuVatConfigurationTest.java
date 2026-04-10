package com.MaSoVa.commerce.order.config;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class EuVatConfigurationTest {

    @Test
    void lookupRate_DE_DINE_IN_FOOD_returns_19() {
        assertThat(buildTestConfig().lookupRate("DE", "DINE_IN", "FOOD")).isEqualTo(19.0);
    }

    @Test
    void lookupRate_DE_TAKEAWAY_FOOD_returns_7() {
        assertThat(buildTestConfig().lookupRate("DE", "TAKEAWAY", "FOOD")).isEqualTo(7.0);
    }

    @Test
    void lookupRate_FR_DINE_IN_FOOD_returns_10() {
        assertThat(buildTestConfig().lookupRate("FR", "DINE_IN", "FOOD")).isEqualTo(10.0);
    }

    @Test
    void lookupRate_FR_DINE_IN_ALCOHOL_returns_20() {
        assertThat(buildTestConfig().lookupRate("FR", "DINE_IN", "ALCOHOL")).isEqualTo(20.0);
    }

    @Test
    void lookupRate_unknown_category_falls_back_to_FOOD_rate() {
        assertThat(buildTestConfig().lookupRate("DE", "DINE_IN", "MYSTERY_ITEM")).isEqualTo(19.0);
    }

    @Test
    void lookupRate_unknown_country_returns_zero() {
        assertThat(buildTestConfig().lookupRate("XX", "DINE_IN", "FOOD")).isEqualTo(0.0);
    }

    @Test
    void isEuStore_true_for_DE() {
        assertThat(buildTestConfig().isEuStore("DE")).isTrue();
    }

    @Test
    void isEuStore_false_for_null() {
        assertThat(buildTestConfig().isEuStore(null)).isFalse();
    }

    private EuVatConfiguration buildTestConfig() {
        EuVatConfiguration config = new EuVatConfiguration();

        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 19.0, "ALCOHOL", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0),
            "DELIVERY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0)
        ));

        EuVatConfiguration.CountryVatProfile fr = new EuVatConfiguration.CountryVatProfile();
        fr.setDefaultRate(10.0);
        fr.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 10.0, "ALCOHOL", 20.0),
            "TAKEAWAY", Map.of("FOOD", 5.5, "ALCOHOL", 20.0),
            "DELIVERY", Map.of("FOOD", 5.5, "ALCOHOL", 20.0)
        ));

        config.setCountries(Map.of("DE", de, "FR", fr));
        return config;
    }
}
