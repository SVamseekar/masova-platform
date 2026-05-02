package com.MaSoVa.commerce.fiscal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class FiscalSignerRegistryTest {

    private FiscalSignerRegistry registry;

    @BeforeEach
    void setUp() {
        PassthroughFiscalSigner passthrough = new PassthroughFiscalSigner();
        GermanyTseFiscalSigner tse = new GermanyTseFiscalSigner();
        FranceNf525FiscalSigner nf525 = new FranceNf525FiscalSigner();
        ItalyRtFiscalSigner rt = new ItalyRtFiscalSigner();
        BelgiumFdmFiscalSigner fdm = new BelgiumFdmFiscalSigner();
        HungaryNtcaFiscalSigner ntca = new HungaryNtcaFiscalSigner();
        UkMtdFiscalSigner mtd = new UkMtdFiscalSigner();

        registry = new FiscalSignerRegistry(passthrough, tse, nf525, rt, fdm, ntca, mtd);
    }

    @Test
    void null_country_returns_passthrough() {
        assertThat(registry.resolve(null)).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @Test
    void india_country_returns_passthrough() {
        assertThat(registry.resolve("IN")).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"NL", "LU", "IE", "CH", "US", "CA"})
    void no_signing_countries_return_passthrough(String country) {
        assertThat(registry.resolve(country)).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @Test
    void de_returns_tse_signer() {
        assertThat(registry.resolve("DE")).isInstanceOf(GermanyTseFiscalSigner.class);
    }

    @Test
    void fr_returns_nf525_signer() {
        assertThat(registry.resolve("FR")).isInstanceOf(FranceNf525FiscalSigner.class);
    }

    @Test
    void it_returns_rt_signer() {
        assertThat(registry.resolve("IT")).isInstanceOf(ItalyRtFiscalSigner.class);
    }

    @Test
    void be_returns_fdm_signer() {
        assertThat(registry.resolve("BE")).isInstanceOf(BelgiumFdmFiscalSigner.class);
    }

    @Test
    void hu_returns_ntca_signer() {
        assertThat(registry.resolve("HU")).isInstanceOf(HungaryNtcaFiscalSigner.class);
    }

    @Test
    void gb_returns_mtd_signer() {
        assertThat(registry.resolve("GB")).isInstanceOf(UkMtdFiscalSigner.class);
    }

    @Test
    void case_insensitive_de_resolves() {
        assertThat(registry.resolve("de")).isInstanceOf(GermanyTseFiscalSigner.class);
    }
}
