package com.MaSoVa.payment.util;

import java.util.Map;

/**
 * Resolves ISO 4217 currency for non-India Stripe stores when the client omits {@code currency}.
 * Client-supplied cart currency always wins when present.
 * Country map matches {@code CountryProfileService} (Global-3 twelve-country programme).
 */
public final class StoreCurrencyResolver {

    /** ISO 3166-1 alpha-2 → ISO 4217 — same 12 countries as core CountryProfileService. */
    private static final Map<String, String> COUNTRY_CURRENCY = Map.ofEntries(
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

    private StoreCurrencyResolver() {}

    public static String resolveCurrency(String countryCode, String requestedCurrency) {
        if (requestedCurrency != null && !requestedCurrency.isBlank()) {
            return requestedCurrency.trim().toUpperCase();
        }
        if (countryCode == null || countryCode.isBlank()) {
            throw new IllegalArgumentException("countryCode is required when currency is omitted");
        }
        String mapped = COUNTRY_CURRENCY.get(countryCode.trim().toUpperCase());
        if (mapped == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return mapped;
    }

    /** Exposed for tests — returns true when country is in the Global programme. */
    public static boolean isSupportedCountry(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return false;
        }
        return COUNTRY_CURRENCY.containsKey(countryCode.trim().toUpperCase());
    }
}