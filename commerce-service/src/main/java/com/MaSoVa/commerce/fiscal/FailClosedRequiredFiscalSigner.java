package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;

/**
 * Prod gate for required signers that still only have a lab stub.
 * Does not call the delegate, so no STUB- signature is stored.
 */
final class FailClosedRequiredFiscalSigner implements FiscalSigner {

    static final String NOT_CONFIGURED = "Live fiscal signing is not configured";

    private final String countryCode;
    private final FiscalSigner delegate;

    FailClosedRequiredFiscalSigner(String countryCode, FiscalSigner delegate) {
        this.countryCode = countryCode;
        this.delegate = delegate;
    }

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        return FiscalSignature.failed(countryCode, delegate.getSignerSystem(), NOT_CONFIGURED);
    }

    @Override
    public boolean isRequired() {
        return delegate.isRequired();
    }

    @Override
    public String getSignerSystem() {
        return delegate.getSignerSystem();
    }
}
