package com.MaSoVa.commerce.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * EU VAT rates per country, order context, and item category.
 * Loaded from application.yml under prefix "eu-vat".
 *
 * Structure:
 * eu-vat:
 *   countries:
 *     DE:
 *       default-rate: 19.0
 *       context-rates:
 *         DINE_IN:
 *           FOOD: 19.0
 *         TAKEAWAY:
 *           FOOD: 7.0
 */
@Configuration
@ConfigurationProperties(prefix = "eu-vat")
public class EuVatConfiguration {

    private Map<String, CountryVatProfile> countries = new HashMap<>();

    /**
     * Returns the VAT rate for the given country, order context, and item category.
     * Falls back: unknown category → FOOD rate for that context → defaultRate → 0.0
     */
    public double lookupRate(String countryCode, String orderContext, String itemCategory) {
        if (countryCode == null || !countries.containsKey(countryCode)) {
            return 0.0;
        }
        CountryVatProfile profile = countries.get(countryCode);

        if (profile.getContextRates() != null && profile.getContextRates().containsKey(orderContext)) {
            Map<String, Double> categoryRates = profile.getContextRates().get(orderContext);
            if (categoryRates.containsKey(itemCategory)) {
                return categoryRates.get(itemCategory);
            }
            if (categoryRates.containsKey("FOOD")) {
                return categoryRates.get("FOOD");
            }
        }

        return profile.getDefaultRate();
    }

    /** Returns true when the countryCode is present in the configured EU countries map. */
    public boolean isEuStore(String countryCode) {
        return countryCode != null && countries.containsKey(countryCode);
    }

    public Map<String, CountryVatProfile> getCountries() { return countries; }
    public void setCountries(Map<String, CountryVatProfile> countries) { this.countries = countries; }

    public static class CountryVatProfile {
        private double defaultRate = 0.0;
        private Map<String, Map<String, Double>> contextRates = new HashMap<>();

        public double getDefaultRate() { return defaultRate; }
        public void setDefaultRate(double defaultRate) { this.defaultRate = defaultRate; }

        public Map<String, Map<String, Double>> getContextRates() { return contextRates; }
        public void setContextRates(Map<String, Map<String, Double>> contextRates) {
            this.contextRates = contextRates;
        }
    }
}
