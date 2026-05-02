package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.springframework.stereotype.Component;

/**
 * No-op signer for countries with no fiscal signing requirement:
 * NL, LU, IE, CH, US, CA — and India (null countryCode).
 */
@Component
public class PassthroughFiscalSigner implements FiscalSigner {

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        String country = order.getVatCountryCode() != null ? order.getVatCountryCode() : "IN";
        return FiscalSignature.passthrough(country);
    }

    @Override
    public boolean isRequired() { return false; }

    @Override
    public String getSignerSystem() { return "PASSTHROUGH"; }
}
