package com.MaSoVa.core.store.service;

import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Maps ISO 3166-1 alpha-2 country code → ISO 4217 currency code + BCP 47 locale tag.
 * India stores pass null countryCode — returns INR / en-IN as legacy fallback.
 * 12 countries supported in Global programme (Global-3).
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
        Map.entry("CA", "CAD")
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
        Map.entry("CA", "en-CA")
    );

    /** Returns ISO 4217 currency code. Returns "INR" for null (India legacy). */
    public String resolveCurrency(String countryCode) {
        if (countryCode == null) return "INR";
        String currency = CURRENCY_MAP.get(countryCode.toUpperCase());
        if (currency == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return currency;
    }

    /** Returns BCP 47 locale tag. Returns "en-IN" for null (India legacy). */
    public String resolveLocale(String countryCode) {
        if (countryCode == null) return "en-IN";
        String locale = LOCALE_MAP.get(countryCode.toUpperCase());
        if (locale == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return locale;
    }
}
