package com.MaSoVa.commerce.fiscal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Resolves the correct FiscalSigner for a given store countryCode.
 * Country is set once at store creation and never changes after first order.
 * Null or unrecognised country → PassthroughFiscalSigner (India + unlisted).
 * When the active profile is prod, every isRequired() signer fails closed.
 * Lab profiles still receive the stub signer.
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
    private final boolean failClosedWhenRequired;

    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd) {
        this(passthrough, tse, nf525, rt, fdm, ntca, mtd, false);
    }

    @Autowired
    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd,
                                 Environment environment) {
        this(passthrough, tse, nf525, rt, fdm, ntca, mtd,
                environment.acceptsProfiles(Profiles.of("prod")));
    }

    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd,
                                 boolean failClosedWhenRequired) {
        this.passthrough = passthrough;
        this.tse = tse;
        this.nf525 = nf525;
        this.rt = rt;
        this.fdm = fdm;
        this.ntca = ntca;
        this.mtd = mtd;
        this.failClosedWhenRequired = failClosedWhenRequired;
    }

    public FiscalSigner resolve(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return passthrough;
        String normalized = countryCode.toUpperCase();
        FiscalSigner signer = switch (normalized) {
            case "DE" -> tse;
            case "FR" -> nf525;
            case "IT" -> rt;
            case "BE" -> fdm;
            case "HU" -> ntca;
            case "GB" -> mtd;
            // NL, LU, IE, CH, US, CA + any other → passthrough
            default -> passthrough;
        };
        if (failClosedWhenRequired && signer.isRequired()) {
            return new FailClosedRequiredFiscalSigner(normalized, signer);
        }
        return signer;
    }
}
