package com.MaSoVa.payment.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

/**
 * Stripe/Razorpay amount conversion — mirrors frontend {@code usesMinorSubdivision}.
 * Major units (cart/order totals) → gateway minor units (cents, pence, or whole HUF).
 */
public final class CurrencyUnits {

    private static final Set<String> NO_DECIMAL_CURRENCIES = Set.of(
            "HUF", "JPY", "KRW", "TWD", "BIF", "CLP", "GNF", "ISK", "MGA",
            "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
    );

    private CurrencyUnits() {}

    public static boolean usesMinorSubdivision(String currency) {
        if (currency == null || currency.isBlank()) {
            return true;
        }
        return !NO_DECIMAL_CURRENCIES.contains(currency.trim().toUpperCase());
    }

    /** Convert major-unit amount (e.g. 42.50 EUR) to Stripe integer amount. */
    public static long majorToStripeAmount(BigDecimal major, String currency) {
        if (major == null) {
            return 0L;
        }
        if (usesMinorSubdivision(currency)) {
            return major.multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();
        }
        return major.setScale(0, RoundingMode.HALF_UP).longValue();
    }
}