package com.MaSoVa.core.store.service;

import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Maps ISO 3166-1 alpha-2 country code → ISO 4217 currency code + BCP 47 locale tag.
 * Null or blank countryCode is rejected — no default currency or locale.
 * 13 countries supported in Global programme (Global-3 including Spain).
 */
@Service
public class CountryProfileService {

    private static final Map<String, String> CURRENCY_MAP = Map.ofEntries(
        Map.entry("DE", "EUR"),
        Map.entry("FR", "EUR"),
        Map.entry("IT", "EUR"),
        Map.entry("NL", "EUR"),
        Map.entry("BE", "EUR"),
        Map.entry("HU", "HUF"),
        Map.entry("LU", "EUR"),
        Map.entry("IE", "EUR"),
        Map.entry("CH", "CHF"),
        Map.entry("GB", "GBP"),
        Map.entry("US", "USD"),
        Map.entry("CA", "CAD"),
        Map.entry("ES", "EUR")
    );

    private static final Map<String, String> LOCALE_MAP = Map.ofEntries(
        Map.entry("DE", "de-DE"),
        Map.entry("FR", "fr-FR"),
        Map.entry("IT", "it-IT"),
        Map.entry("NL", "nl-NL"),
        Map.entry("BE", "nl-BE"),
        Map.entry("HU", "hu-HU"),
        Map.entry("LU", "lb-LU"),
        Map.entry("IE", "en-IE"),
        Map.entry("CH", "de-CH"),
        Map.entry("GB", "en-GB"),
        Map.entry("US", "en-US"),
        Map.entry("CA", "en-CA"),
        Map.entry("ES", "es-ES")
    );

    /** Returns ISO 4217 currency code. Rejects null/blank countryCode. */
    public String resolveCurrency(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            throw new IllegalArgumentException("countryCode is required");
        }
        String currency = CURRENCY_MAP.get(countryCode.trim().toUpperCase());
        if (currency == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return currency;
    }

    /** Returns BCP 47 locale tag. Rejects null/blank countryCode. */
    public String resolveLocale(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            throw new IllegalArgumentException("countryCode is required");
        }
        String locale = LOCALE_MAP.get(countryCode.trim().toUpperCase());
        if (locale == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return locale;
    }
}
