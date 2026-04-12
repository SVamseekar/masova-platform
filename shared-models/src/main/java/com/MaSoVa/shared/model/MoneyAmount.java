package com.MaSoVa.shared.model;

import java.util.Objects;

/**
 * Immutable money value object. Amount stored as minor units (e.g., cents, paise).
 * INR: 1 rupee = 100 paise — store 100 for ₹1.
 * EUR: 1 euro = 100 cents — store 100 for €1.
 * HUF: no minor subdivision — store face value directly.
 * Used in Order and OrderItem for Global-3+ multi-currency support.
 */
public final class MoneyAmount {

    private final long amountMinorUnits;
    private final String currency; // ISO 4217, e.g. "INR", "EUR", "GBP"

    private MoneyAmount(long amountMinorUnits, String currency) {
        this.amountMinorUnits = amountMinorUnits;
        this.currency = currency;
    }

    public static MoneyAmount ofMinorUnits(long amountMinorUnits, String currency) {
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("currency must not be null or blank");
        }
        if (amountMinorUnits < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
        return new MoneyAmount(amountMinorUnits, currency);
    }

    public long getAmountMinorUnits() { return amountMinorUnits; }
    public String getCurrency() { return currency; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MoneyAmount that)) return false;
        return amountMinorUnits == that.amountMinorUnits && Objects.equals(currency, that.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amountMinorUnits, currency);
    }

    @Override
    public String toString() {
        return amountMinorUnits + " " + currency;
    }
}
