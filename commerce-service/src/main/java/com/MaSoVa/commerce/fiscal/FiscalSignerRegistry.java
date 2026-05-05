package com.MaSoVa.commerce.fiscal;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct FiscalSigner for a given store countryCode.
 * Country is set once at store creation and never changes after first order.
 * Null or unrecognised country → PassthroughFiscalSigner (India + unlisted).
 */
@Component
public class FiscalSignerRegistry {

    private final PassthroughFiscalSigner passthrough;
    private final GermanyTseFiscalSigner tse;
    private final FranceNf525FiscalSigner nf525;
    private final ItalyRtFiscalSigner rt;
    private final BelgiumFdmFiscalSigner fdm;
    private final HungaryNtcaFiscalSigner ntca;
    private final UkMtdFiscalSigner mtd;

    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd) {
        this.passthrough = passthrough;
        this.tse = tse;
        this.nf525 = nf525;
        this.rt = rt;
        this.fdm = fdm;
        this.ntca = ntca;
        this.mtd = mtd;
    }

    public FiscalSigner resolve(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return passthrough;
        return switch (countryCode.toUpperCase()) {
            case "DE" -> tse;
            case "FR" -> nf525;
            case "IT" -> rt;
            case "BE" -> fdm;
            case "HU" -> ntca;
            case "GB" -> mtd;
            // NL, LU, IE, CH, US, CA + any other → passthrough
            default -> passthrough;
        };
    }
}
