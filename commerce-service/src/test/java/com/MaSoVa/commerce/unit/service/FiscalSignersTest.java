package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.fiscal.*;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FiscalSignersTest {

    private Order buildOrder(String id) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-001");
        o.setStoreId("store-1");
        o.setTotal(BigDecimal.valueOf(300));
        return o;
    }

    // PassthroughFiscalSigner

    @Test
    void passthroughSigner_returns_passthrough_signature() {
        PassthroughFiscalSigner signer = new PassthroughFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.isSigningFailed()).isFalse();
        assertThat(sig.getSignerSystem()).isEqualTo("PASSTHROUGH");
    }

    @Test
    void passthroughSigner_isRequired_false() {
        assertThat(new PassthroughFiscalSigner().isRequired()).isFalse();
    }

    @Test
    void passthroughSigner_getSignerSystem_returns_PASSTHROUGH() {
        assertThat(new PassthroughFiscalSigner().getSignerSystem()).isEqualTo("PASSTHROUGH");
    }

    // GermanyTseFiscalSigner

    @Test
    void germanyTseSigner_returns_signature_with_TSE_system() {
        GermanyTseFiscalSigner signer = new GermanyTseFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("TSE");
        assertThat(sig.isSigningFailed()).isFalse();
    }

    @Test
    void germanyTseSigner_isRequired_true() {
        assertThat(new GermanyTseFiscalSigner().isRequired()).isTrue();
    }

    // FranceNf525FiscalSigner

    @Test
    void franceNf525Signer_returns_signature_with_NF525_system() {
        FranceNf525FiscalSigner signer = new FranceNf525FiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("NF525");
        assertThat(sig.isSigningFailed()).isFalse();
    }

    // ItalyRtFiscalSigner

    @Test
    void italyRtSigner_returns_signature_with_RT_system() {
        ItalyRtFiscalSigner signer = new ItalyRtFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("RT");
    }

    // BelgiumFdmFiscalSigner

    @Test
    void belgiumFdmSigner_returns_signature_with_FDM_system() {
        BelgiumFdmFiscalSigner signer = new BelgiumFdmFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("FDM");
    }

    // HungaryNtcaFiscalSigner

    @Test
    void hungaryNtcaSigner_returns_signature_with_NTCA_system() {
        HungaryNtcaFiscalSigner signer = new HungaryNtcaFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("NTCA");
    }

    // UkMtdFiscalSigner

    @Test
    void ukMtdSigner_returns_signature_with_MTD_system() {
        UkMtdFiscalSigner signer = new UkMtdFiscalSigner();
        FiscalSignature sig = signer.sign(buildOrder("o1"), null);

        assertThat(sig.getSignerSystem()).isEqualTo("MTD");
    }

    // FiscalSignerRegistry

    @Test
    void fiscalSignerRegistry_resolves_DE_to_TSE() {
        FiscalSignerRegistry registry = new FiscalSignerRegistry(
                new PassthroughFiscalSigner(),
                new GermanyTseFiscalSigner(),
                new FranceNf525FiscalSigner(),
                new ItalyRtFiscalSigner(),
                new BelgiumFdmFiscalSigner(),
                new HungaryNtcaFiscalSigner(),
                new UkMtdFiscalSigner()
        );

        assertThat(registry.resolve("DE").getSignerSystem()).isEqualTo("TSE");
        assertThat(registry.resolve("FR").getSignerSystem()).isEqualTo("NF525");
        assertThat(registry.resolve("IT").getSignerSystem()).isEqualTo("RT");
        assertThat(registry.resolve("BE").getSignerSystem()).isEqualTo("FDM");
        assertThat(registry.resolve("HU").getSignerSystem()).isEqualTo("NTCA");
        assertThat(registry.resolve("GB").getSignerSystem()).isEqualTo("MTD");
        assertThat(registry.resolve(null).getSignerSystem()).isEqualTo("PASSTHROUGH");
        assertThat(registry.resolve("IN").getSignerSystem()).isEqualTo("PASSTHROUGH");
    }
}
