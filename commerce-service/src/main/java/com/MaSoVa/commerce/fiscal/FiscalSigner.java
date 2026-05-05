package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;

/**
 * Country-specific fiscal signing adapter.
 * Each implementation handles exactly one country's fiscal law.
 * OrderService never calls this directly — always via FiscalSignerRegistry.
 */
public interface FiscalSigner {

    /**
     * Signs the order and returns a FiscalSignature.
     * Must never throw — returns FiscalSignature.failed(...) on any error.
     */
    FiscalSignature sign(Order order, VatBreakdown vatBreakdown);

    /**
     * Returns true when fiscal signing is legally required in this country.
     * Passthrough implementations return false.
     */
    boolean isRequired();

    /**
     * ISO 3166-1 alpha-2 country code this signer handles.
     * PassthroughFiscalSigner handles multiple — registry uses explicit routing.
     */
    String getSignerSystem();
}
