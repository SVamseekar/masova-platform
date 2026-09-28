package com.MaSoVa.commerce.fiscal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Resolves the correct FiscalSigner for a given store countryCode.
 * Country is set once at store creation and never changes after first order.
 * Null or unrecognised country → PassthroughFiscalSigner (India + unlisted).
 *
 * fiscal.signing.mode, default CERTIFIED: every isRequired() signer fails closed
 * unless a real certified provider is wired in (none exist yet — see FailClosedRequiredFiscalSigner).
 * LAB_STUB is the only opt-out, set explicitly by dev/lab compose profiles — never the default,
 * so a Cloud Run deploy with no profile set is safe by default (#126).
 */
@Component
public class FiscalSignerRegistry {

    private static final String LAB_STUB = "LAB_STUB";

    private final PassthroughFiscalSigner passthrough;
    private final GermanyTseFiscalSigner tse;
    private final FranceNf525FiscalSigner nf525;
    private final ItalyRtFiscalSigner rt;
    private final BelgiumFdmFiscalSigner fdm;
    private final HungaryNtcaFiscalSigner ntca;
    private final UkMtdFiscalSigner mtd;
    private final boolean failClosedWhenRequired;

    /** Test-friendly: defaults to LAB_STUB (never fail closed). */
    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd) {
        this(passthrough, tse, nf525, rt, fdm, ntca, mtd, LAB_STUB);
    }

    @Autowired
    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd,
                                 @Value("${fiscal.signing.mode:CERTIFIED}") String mode) {
        this.passthrough = passthrough;
        this.tse = tse;
        this.nf525 = nf525;
        this.rt = rt;
        this.fdm = fdm;
        this.ntca = ntca;
        this.mtd = mtd;
        this.failClosedWhenRequired = !LAB_STUB.equalsIgnoreCase(mode);
    }

    public FiscalSigner resolve(String countryCode) {
        FiscalSigner signer = resolveUnwrapped(countryCode);
        if (failClosedWhenRequired && signer.isRequired()) {
            return new FailClosedRequiredFiscalSigner(countryCode.toUpperCase(), signer);
        }
        return signer;
    }

    /** True when a store in this country cannot go live: it needs a certified signer and has none (#126). */
    public boolean blocksLiveTrading(String countryCode) {
        return failClosedWhenRequired && resolveUnwrapped(countryCode).isRequired();
    }

    private FiscalSigner resolveUnwrapped(String countryCode) {
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
